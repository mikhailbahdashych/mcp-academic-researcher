import json
import os
import sys
from contextlib import AsyncExitStack
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
    "Use save_note to capture important insights after research sessions. "
    "At the start of a relevant query, call search_notes to retrieve semantically related prior notes. "
    "Always base your answer on the actual papers provided."
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
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

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
            # --- Pre-search: always run search tools before the LLM turn ---
            pre_search_tools = ["search_arxiv", "search_openalex"]
            for tool_name in pre_search_tools:
                if tool_name not in tool_session:
                    continue
                try:
                    result = await tool_session[tool_name].call_tool(
                        tool_name, {"query": request.message, "max_results": 5}
                    )
                    accumulated_papers.extend(_parse_papers(result))
                    messages.append({
                        "role": "assistant",
                        "content": "",
                        "tool_calls": [
                            {"function": {"name": tool_name, "arguments": {"query": request.message, "max_results": 5}}}
                        ],
                    })
                    messages.append({
                        "role": "tool",
                        "content": json.dumps([getattr(c, "text", str(c)) for c in result.content]),
                    })
                except Exception:
                    pass

        messages.append({"role": "user", "content": request.message})

        # --- LLM loop: model summarizes results, may call more tools ---
        client = ollama.AsyncClient(host=OLLAMA_BASE_URL)

        while True:
            response = await client.chat(
                model=MODEL,
                messages=messages,
                tools=ollama_tools,
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
                yield _sse_papers(accumulated_papers)
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

                accumulated_papers.extend(_parse_papers(result))

                messages.append({
                    "role": "tool",
                    "content": json.dumps([getattr(c, "text", str(c)) for c in result.content]),
                })
