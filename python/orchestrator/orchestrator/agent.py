import json
import logging
import re
import sys
from collections.abc import AsyncGenerator, Container
from contextlib import AsyncExitStack
from dataclasses import dataclass
from pathlib import Path

from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

from .llm import LLMClient, LLMError, LLMSettings, ToolCall, build_client, new_tool_call_id
from .models import ChatRequest

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an academic research assistant. "
    "You will be provided with search results from arXiv and OpenAlex. "
    "Summarize the key findings from the provided papers and present them clearly. "
    "You may use the available tools to search for additional papers if needed. "
    "When the user explicitly asks you to save or make notes, you MUST call save_note immediately — do not just describe what you would save. "
    "Related prior notes are automatically retrieved and provided to you at the start of each paper search — do not call search_notes for paper search queries. "
    "Always base your answer on the actual papers provided. "
    "When calling save_note about specific papers, set the paper_id field to the EXACT paper IDs from the search results (the 'id' field). "
    "For arXiv papers use the arXiv ID (e.g. '2301.12345v1'). For OpenAlex papers use the DOI or OpenAlex URL from the 'id' field. "
    "NEVER invent or guess DOIs — only use IDs that appear in the search results. Comma-separate multiple IDs. "
)


def _resolve_bin(name: str) -> str:
    """Resolve a binary name to an absolute path within the current venv.

    Checks if the binary exists in the same directory as the running Python
    interpreter (handles virtual environments). Falls back to the bare name
    for PATH resolution.

    Args:
        name: Binary name (e.g., "mcp-papers").

    Returns:
        Absolute path if found in the venv bin dir, otherwise the bare name.
    """
    candidate = Path(sys.executable).parent / name
    return str(candidate) if candidate.exists() else name


def _mcp_tool_to_canonical(tool) -> dict:
    """Convert an MCP tool schema to the canonical tool format.

    The canonical format is the one `llm.py` translates for each provider (it
    happens to be Ollama's own wire format).

    Args:
        tool: MCP Tool object with name, description, and inputSchema attributes.

    Returns:
        Dictionary with type, function.name, function.description, and
        function.parameters.
    """
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.inputSchema,
        },
    }


def _parse_papers(result) -> list[dict]:
    """Extract paper dictionaries from an MCP tool call result.

    Iterates over the result's content items, extracts JSON text, and parses
    it into paper dictionaries. Handles both single objects and arrays.

    Args:
        result: MCP CallToolResult from session.call_tool().

    Returns:
        List of paper dictionaries parsed from the result's text content.
    """
    papers = []
    for content_item in result.content:
        raw = getattr(content_item, "text", None)
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    papers.extend(parsed)
                elif isinstance(parsed, dict):
                    papers.append(parsed)
            except (json.JSONDecodeError, TypeError):
                pass
    return papers


#: Paper-search tools that can be pre-called; a request names them by suffix.
PRE_SEARCH_TOOLS = ["search_arxiv", "search_openalex"]

#: Excluded from the LLM's tool list after a pre-search, so it cannot re-run them.
SEARCH_TOOL_NAMES = {"search_arxiv", "search_openalex", "search_notes"}

#: Ceiling on LLM round trips per request, so a tool-calling loop cannot run away.
MAX_TOOL_ITERATIONS = 8


def _select_search_tools(sources: list[str] | None, available: Container[str]) -> list[str]:
    """Pick the pre-search tools to run for the sources a request asked for.

    Args:
        sources: Source suffixes ("arxiv", "openalex"); None means every source.
        available: Tool names the connected MCP servers actually offer.

    Returns:
        Tool names to pre-call, in a stable order. Unknown source names select
        nothing rather than raising.
    """
    return [
        name
        for name in PRE_SEARCH_TOOLS
        if name in available and (sources is None or name.split("_", 1)[1] in sources)
    ]


def _result_texts(result) -> list[str]:
    """Extract the text of each content item in an MCP tool result."""
    return [getattr(c, "text", str(c)) for c in result.content]


def _build_tool_exchange(
    tool_name: str, tool_args: dict, result_texts: list[str]
) -> tuple[dict, dict]:
    """Record an already-executed tool call as an assistant/tool message pair.

    Providers require every tool result to name the call it answers, so the two
    messages share a freshly minted id.

    Args:
        tool_name: Name of the tool that was called.
        tool_args: Arguments it was called with.
        result_texts: Text content items the tool returned.

    Returns:
        The (assistant, tool) message pair, ready to append in that order.
    """
    call_id = new_tool_call_id()
    assistant = {
        "role": "assistant",
        "content": "",
        "tool_calls": [{"id": call_id, "function": {"name": tool_name, "arguments": tool_args}}],
    }
    tool = {
        "role": "tool",
        "content": json.dumps(result_texts),
        "tool_call_id": call_id,
        "name": tool_name,
    }
    return assistant, tool


def _sse_token(text: str) -> str:
    """Format a text token as an SSE data line."""
    return f"data: {json.dumps({'type': 'token', 'data': text})}\n\n"


def _sse_papers(papers: list[dict]) -> str:
    """Format a list of paper dicts as an SSE data line."""
    return f"data: {json.dumps({'type': 'papers', 'data': papers})}\n\n"


def _sse_done() -> str:
    """Format a done event as an SSE data line."""
    return f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"


def _dedup_papers(papers: list[dict], limit: int | None = None) -> list[dict]:
    """Deduplicate papers by normalised title, keeping the first occurrence.
    If limit is given, return at most that many papers."""
    seen: set[str] = set()
    result: list[dict] = []
    for p in papers:
        key = p.get("title", "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(p)
        if limit and len(result) >= limit:
            break
    return result


DEFAULT_MAX_RESULTS = 5


@dataclass
class SearchIntent:
    query: str
    max_results: int = DEFAULT_MAX_RESULTS
    sort_by_date: bool = False
    year_from: int | None = None
    year_to: int | None = None


async def _extract_search_query(
    client: LLMClient,
    message: str,
    history: list[dict],
) -> SearchIntent | None:
    """
    Returns a SearchIntent if the message warrants searching for papers (with optional
    date constraints), or None if the message is not a paper search request.
    """
    recent_context = ""
    for m in history[-6:]:
        role = m.get("role", "")
        content = str(m.get("content", ""))[:300]
        if role in ("user", "assistant") and content:
            recent_context += f"{role}: {content}\n"

    prompt = (
        "You are a query classifier for an academic paper search system.\n"
        "Decide whether the user's message is requesting a search for academic papers.\n"
        "Reply NO for: saving/making notes, citing papers, summarizing already-found results, "
        "follow-up questions about existing content, or any non-search requests.\n\n"
        + (f"Recent conversation:\n{recent_context}\n" if recent_context else "")
        + f"User message: {message}\n\n"
        "Reply ONLY in this exact format (no other text):\n"
        "SEARCH: yes|no\n"
        "QUERY: <3-8 keyword academic search query, empty if SEARCH is no>\n"
        "MAX_RESULTS: <integer, how many papers the user wants, default 5>\n"
        "SORT_BY_DATE: yes|no\n"
        "YEAR_FROM: <4-digit year or empty>\n"
        "YEAR_TO: <4-digit year or empty>\n\n"
        "Rules:\n"
        "- MAX_RESULTS: extract the number of papers the user explicitly requests. If not specified, default to 5.\n"
        "- SORT_BY_DATE yes if user says 'latest', 'recent', 'newest', 'most recent'\n"
        "- YEAR_FROM / YEAR_TO if user specifies a year range like 'from 2022 to 2024' or 'since 2023' or 'before 2020'\n"
        "- QUERY must contain ONLY topic/subject keywords. NEVER put years, dates, or time references in QUERY — use YEAR_FROM / YEAR_TO instead.\n\n"
        "Examples:\n"
        "message: 'Provide me with 5 papers on transformer architectures from 2023'\n"
        "SEARCH: yes\nQUERY: transformer architecture\nMAX_RESULTS: 5\nSORT_BY_DATE: no\nYEAR_FROM: 2023\nYEAR_TO: 2023\n\n"
        "message: 'Can you please provide me with the latest papers on transformer architectures?'\n"
        "SEARCH: yes\nQUERY: transformer architecture\nMAX_RESULTS: 5\nSORT_BY_DATE: yes\nYEAR_FROM:\nYEAR_TO:\n\n"
        "message: 'find 10 papers on RL from 2022 to 2024'\n"
        "SEARCH: yes\nQUERY: reinforcement learning\nMAX_RESULTS: 10\nSORT_BY_DATE: no\nYEAR_FROM: 2022\nYEAR_TO: 2024\n\n"
        "message: 'give me 3 recent papers on diffusion models since 2023'\n"
        "SEARCH: yes\nQUERY: diffusion models\nMAX_RESULTS: 3\nSORT_BY_DATE: yes\nYEAR_FROM: 2023\nYEAR_TO:\n\n"
        "message: 'Could you please make notes out of it?'\n"
        "SEARCH: no\nQUERY:\nMAX_RESULTS: 5\nSORT_BY_DATE: no\nYEAR_FROM:\nYEAR_TO:\n\n"
        "message: 'What were the main findings?'\n"
        "SEARCH: no\nQUERY:\nMAX_RESULTS: 5\nSORT_BY_DATE: no\nYEAR_FROM:\nYEAR_TO:\n"
    )

    text = await client.complete([{"role": "user", "content": prompt}], max_tokens=256)

    is_search = bool(re.search(r"SEARCH:\s*yes", text, re.IGNORECASE))
    if not is_search:
        return None

    query_match = re.search(r"QUERY:\s*(.+)", text)
    query = query_match.group(1).strip() if query_match else ""
    if not query:
        return None

    max_results_match = re.search(r"MAX_RESULTS:\s*(\d+)", text)
    max_results = int(max_results_match.group(1)) if max_results_match else DEFAULT_MAX_RESULTS
    max_results = max(1, min(max_results, 20))  # clamp to [1, 20]

    sort_by_date = bool(re.search(r"SORT_BY_DATE:\s*yes", text, re.IGNORECASE))

    year_from_match = re.search(r"YEAR_FROM:\s*(\d{4})", text)
    year_to_match = re.search(r"YEAR_TO:\s*(\d{4})", text)
    year_from = int(year_from_match.group(1)) if year_from_match else None
    year_to = int(year_to_match.group(1)) if year_to_match else None

    return SearchIntent(query=query, max_results=max_results, sort_by_date=sort_by_date, year_from=year_from, year_to=year_to)


async def _open_session(stack: AsyncExitStack, bin_name: str) -> ClientSession:
    """Open an MCP client session by spawning a server subprocess.

    Resolves the binary path within the current venv, establishes a stdio
    connection, and initializes the MCP protocol handshake.

    Args:
        stack: AsyncExitStack for managing subprocess lifecycle cleanup.
        bin_name: Executable name (e.g., "mcp-papers").

    Returns:
        Initialized ClientSession ready for list_tools() and call_tool().
    """
    read, write = await stack.enter_async_context(
        stdio_client(StdioServerParameters(command=_resolve_bin(bin_name), args=[]))
    )
    session = await stack.enter_async_context(ClientSession(read, write))
    await session.initialize()
    return session


async def run(request: ChatRequest) -> AsyncGenerator[str, None]:
    """Main agentic loop -- the core entry point for processing chat requests.

    This async generator orchestrates the full request lifecycle:
    1. Spawns MCP server subprocesses (papers, citations, notes)
    2. Builds a tool registry mapping tool names to MCP sessions
    3. Builds the LLM client for the provider the request asked for
    4. Classifies user intent (search vs. non-search) via the LLM
    5. Pre-calls search tools if a search intent is detected
    6. Runs the LLM loop, handling any additional tool calls
    7. Yields SSE-formatted strings for each token, paper, and done event

    Messages are ordered the way every provider expects: system prompt, history,
    the user's message, then the assistant/tool pairs recording any pre-calls.

    A provider failure is reported as answer text (a leading warning sign) rather
    than an SSE ``error`` event, which the frontend treats as a dropped stream.

    Args:
        request: ChatRequest with message, history, and optional force_tool,
            sources, and llm provider config.

    Yields:
        SSE-formatted strings (e.g., 'data: {"type":"token","data":"..."}\n\n').
    """
    async with AsyncExitStack() as stack:
        papers_session = await _open_session(stack, "mcp-papers")
        citations_session = await _open_session(stack, "mcp-citations")
        notes_session = await _open_session(stack, "mcp-notes")

        # Build tool registry
        tool_session: dict[str, ClientSession] = {}
        all_tools: list[dict] = []
        for session in (papers_session, citations_session, notes_session):
            result = await session.list_tools()
            for tool in result.tools:
                tool_session[tool.name] = session
                all_tools.append(_mcp_tool_to_canonical(tool))

        accumulated_papers: list[dict] = []
        requested_max_results: int | None = None
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

        try:
            client = build_client(
                LLMSettings(**request.llm.model_dump()) if request.llm else None
            )

            # --- Classify intent before appending the current message, so the
            # classifier's recent-context window does not see it twice ---
            search_query: SearchIntent | None = None
            if not request.force_tool:
                search_query = await _extract_search_query(client, request.message, messages)

            messages.append({"role": "user", "content": request.message})

            if request.force_tool:
                # --- Forced tool call: skip pre-search, call the specified tool directly ---
                tool_name = request.force_tool.name
                tool_args = request.force_tool.args
                session = tool_session.get(tool_name, citations_session)
                try:
                    result = await session.call_tool(tool_name, tool_args)
                except Exception as exc:
                    logger.exception("Forced tool %s failed", tool_name)
                    # Still pair the call with a result: a dangling tool call is a
                    # protocol error for Anthropic, and the model needs to know.
                    messages.extend(
                        _build_tool_exchange(
                            tool_name, tool_args, [json.dumps({"error": str(exc)})]
                        )
                    )
                else:
                    accumulated_papers.extend(_parse_papers(result))
                    messages.extend(
                        _build_tool_exchange(tool_name, tool_args, _result_texts(result))
                    )
            elif search_query:
                # --- Pre-search: only when the message is actually a paper search request ---
                requested_max_results = search_query.max_results
                search_args: dict = {
                    "query": search_query.query,
                    "max_results": requested_max_results,
                }
                if search_query.sort_by_date:
                    search_args["sort_by_date"] = True
                if search_query.year_from is not None:
                    search_args["year_from"] = search_query.year_from
                if search_query.year_to is not None:
                    search_args["year_to"] = search_query.year_to

                for tool_name in _select_search_tools(request.sources, tool_session):
                    try:
                        result = await tool_session[tool_name].call_tool(tool_name, search_args)
                    except Exception:
                        # One dead source must not sink the answer the other found.
                        logger.exception("Pre-search tool %s failed", tool_name)
                        continue
                    accumulated_papers.extend(_parse_papers(result))
                    messages.extend(
                        _build_tool_exchange(tool_name, search_args, _result_texts(result))
                    )

                # --- Pre-fetch related notes so LLM has context without calling the tool itself ---
                if "search_notes" in tool_session:
                    notes_args = {"query": search_query.query, "limit": 5}
                    try:
                        notes_result = await tool_session["search_notes"].call_tool(
                            "search_notes", notes_args
                        )
                    except Exception:
                        logger.exception("Note pre-fetch failed")
                    else:
                        messages.extend(
                            _build_tool_exchange(
                                "search_notes", notes_args, _result_texts(notes_result)
                            )
                        )

            # --- LLM loop: model summarizes results, may call more tools ---
            # After pre-search, exclude search tools and search_notes to prevent duplicate calls
            if search_query:
                llm_tools = [
                    t for t in all_tools if t["function"]["name"] not in SEARCH_TOOL_NAMES
                ]
            else:
                llm_tools = all_tools

            for _ in range(MAX_TOOL_ITERATIONS):
                full_content = ""
                tool_calls: list[ToolCall] = []

                async for event in client.stream(messages, llm_tools):
                    if event.text:
                        full_content += event.text
                        yield _sse_token(event.text)
                    if event.tool_call:
                        tool_calls.append(event.tool_call)

                if not tool_calls:
                    break

                messages.append({
                    "role": "assistant",
                    "content": full_content,
                    "tool_calls": [
                        {"id": tc.id, "function": {"name": tc.name, "arguments": tc.arguments}}
                        for tc in tool_calls
                    ],
                })

                for tc in tool_calls:
                    session = tool_session.get(tc.name, papers_session)
                    try:
                        result = await session.call_tool(tc.name, tc.arguments)
                    except Exception as exc:
                        # Hand the failure back as the tool's result: the model can
                        # apologise or retry, where a raised error would kill the stream.
                        logger.exception("Tool %s failed", tc.name)
                        content = json.dumps({"error": str(exc)})
                    else:
                        if tc.name in SEARCH_TOOL_NAMES:
                            accumulated_papers.extend(_parse_papers(result))
                        content = json.dumps(_result_texts(result))

                    messages.append({
                        "role": "tool",
                        "content": content,
                        "tool_call_id": tc.id,
                        "name": tc.name,
                    })
        except Exception as exc:
            # LLMError and ValueError (e.g. an unconfigured key) already read as
            # user-facing text; anything else gets a prefix so the bubble is not
            # a bare repr. The exception is logged without any provider settings,
            # which would carry the API key.
            logger.exception("Chat request failed (%s)", type(exc).__name__)
            detail = (
                str(exc) if isinstance(exc, LLMError | ValueError) else f"Request failed: {exc}"
            )
            yield _sse_token(f"\u26a0\ufe0f {detail}")

        yield _sse_papers(_dedup_papers(accumulated_papers, requested_max_results))
        yield _sse_done()
        yield "data: [DONE]\n\n"
