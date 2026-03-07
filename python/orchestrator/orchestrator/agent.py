import json
import os
import re
import sys
from contextlib import AsyncExitStack
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncGenerator

import ollama
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

from .models import ChatRequest

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = "qwen2.5:7b"

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
    candidate = Path(sys.executable).parent / name
    return str(candidate) if candidate.exists() else name


def _mcp_tool_to_ollama(tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.inputSchema,
        },
    }


def _parse_papers(result) -> list[dict]:
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


def _sse_token(text: str) -> str:
    return f"data: {json.dumps({'type': 'token', 'data': text})}\n\n"


def _sse_papers(papers: list[dict]) -> str:
    return f"data: {json.dumps({'type': 'papers', 'data': papers})}\n\n"


def _sse_done() -> str:
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
    client: ollama.AsyncClient,
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

    response = await client.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=False,
    )

    text = response.message.content or ""

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
    read, write = await stack.enter_async_context(
        stdio_client(StdioServerParameters(command=_resolve_bin(bin_name), args=[]))
    )
    session = await stack.enter_async_context(ClientSession(read, write))
    await session.initialize()
    return session


async def run(request: ChatRequest) -> AsyncGenerator[str, None]:
    async with AsyncExitStack() as stack:
        papers_session = await _open_session(stack, "mcp-papers")
        citations_session = await _open_session(stack, "mcp-citations")
        notes_session = await _open_session(stack, "mcp-notes")

        # Build tool registry
        tool_session: dict[str, ClientSession] = {}
        ollama_tools: list[dict] = []
        for session in (papers_session, citations_session, notes_session):
            result = await session.list_tools()
            for tool in result.tools:
                tool_session[tool.name] = session
                ollama_tools.append(_mcp_tool_to_ollama(tool))

        accumulated_papers: list[dict] = []
        requested_max_results: int | None = None
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

        client = ollama.AsyncClient(host=OLLAMA_BASE_URL)

        search_query: SearchIntent | None = None

        if request.force_tool:
            # --- Forced tool call: skip pre-search, call the specified tool directly ---
            tool_name = request.force_tool.name
            tool_args = request.force_tool.args
            session = tool_session.get(tool_name, citations_session)
            try:
                result = await session.call_tool(tool_name, tool_args)
                accumulated_papers.extend(_parse_papers(result))
                messages.append({
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [{"function": {"name": tool_name, "arguments": tool_args}}],
                })
                messages.append({
                    "role": "tool",
                    "content": json.dumps([getattr(c, "text", str(c)) for c in result.content]),
                })
            except Exception as e:
                messages.append({"role": "user", "content": f"Tool call failed: {e}"})
        else:
            # --- Classify intent and extract a clean search query ---
            search_query = await _extract_search_query(client, request.message, messages)

            if search_query:
                # --- Pre-search: only when the message is actually a paper search request ---
                requested_max_results = search_query.max_results
                tool_args: dict = {"query": search_query.query, "max_results": requested_max_results}
                if search_query.sort_by_date:
                    tool_args["sort_by_date"] = True
                if search_query.year_from is not None:
                    tool_args["year_from"] = search_query.year_from
                if search_query.year_to is not None:
                    tool_args["year_to"] = search_query.year_to

                for tool_name in ["search_arxiv", "search_openalex"]:
                    if tool_name not in tool_session:
                        continue
                    try:
                        result = await tool_session[tool_name].call_tool(tool_name, tool_args)
                        accumulated_papers.extend(_parse_papers(result))
                        messages.append({
                            "role": "assistant",
                            "content": "",
                            "tool_calls": [{"function": {"name": tool_name, "arguments": tool_args}}],
                        })
                        messages.append({
                            "role": "tool",
                            "content": json.dumps([getattr(c, "text", str(c)) for c in result.content]),
                        })
                    except Exception:
                        pass

                # --- Pre-fetch related notes so LLM has context without calling the tool itself ---
                if "search_notes" in tool_session:
                    try:
                        notes_result = await tool_session["search_notes"].call_tool(
                            "search_notes", {"query": search_query.query, "limit": 5}
                        )
                        messages.append({
                            "role": "assistant",
                            "content": "",
                            "tool_calls": [{"function": {"name": "search_notes", "arguments": {"query": search_query.query, "limit": 5}}}],
                        })
                        messages.append({
                            "role": "tool",
                            "content": json.dumps([getattr(c, "text", str(c)) for c in notes_result.content]),
                        })
                    except Exception:
                        pass

        messages.append({"role": "user", "content": request.message})

        # --- LLM loop: model summarizes results, may call more tools ---
        # After pre-search, exclude search tools and search_notes to prevent duplicate calls
        SEARCH_TOOL_NAMES = {"search_arxiv", "search_openalex", "search_notes"}
        if search_query:
            llm_tools = [t for t in ollama_tools if t["function"]["name"] not in SEARCH_TOOL_NAMES]
        else:
            llm_tools = ollama_tools

        while True:
            response = await client.chat(
                model=MODEL,
                messages=messages,
                tools=llm_tools,
                stream=True,
            )

            full_content = ""
            tool_calls = []

            async for chunk in response:
                msg = chunk.message
                if msg.content:
                    full_content += msg.content
                    yield _sse_token(msg.content)
                if msg.tool_calls:
                    tool_calls.extend(msg.tool_calls)

            if not tool_calls:
                yield _sse_papers(_dedup_papers(accumulated_papers, requested_max_results))
                yield _sse_done()
                yield "data: [DONE]\n\n"
                break

            messages.append({
                "role": "assistant",
                "content": full_content,
                "tool_calls": [
                    {"function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                    for tc in tool_calls
                ],
            })

            for tc in tool_calls:
                tool_name = tc.function.name
                tool_args = tc.function.arguments or {}
                if isinstance(tool_args, str):
                    tool_args = json.loads(tool_args)

                session = tool_session.get(tool_name, papers_session)
                result = await session.call_tool(tool_name, tool_args)

                if tool_name in SEARCH_TOOL_NAMES:
                    accumulated_papers.extend(_parse_papers(result))

                messages.append({
                    "role": "tool",
                    "content": json.dumps([getattr(c, "text", str(c)) for c in result.content]),
                })
