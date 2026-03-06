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
    "When the user asks about a research topic, use the available tools to search for relevant "
    "academic papers from arXiv and OpenAlex. "
    "When the user asks about citations or references for a specific paper, use get_citations "
    "or get_references with the paper's OpenAlex ID or DOI. "
    "After searching, summarize the key findings and present the papers you found. "
    "Always search before answering research questions."
)


def _resolve_bin(name: str) -> str:
    """Find a script in the current venv, falling back to PATH."""
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


def _sse_token(text: str) -> str:
    return f"data: {json.dumps({'type': 'token', 'data': text})}\n\n"


def _sse_papers(papers: list[dict]) -> str:
    return f"data: {json.dumps({'type': 'papers', 'data': papers})}\n\n"


def _sse_done() -> str:
    return f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"


async def _open_session(stack: AsyncExitStack, bin_name: str) -> ClientSession:
    """Spawn an MCP server subprocess and return an initialised ClientSession."""
    read, write = await stack.enter_async_context(
        stdio_client(StdioServerParameters(command=_resolve_bin(bin_name), args=[]))
    )
    session = await stack.enter_async_context(ClientSession(read, write))
    await session.initialize()
    return session


async def run(request: ChatRequest) -> AsyncGenerator[str, None]:
    async with AsyncExitStack() as stack:
        # Open both MCP servers
        papers_session = await _open_session(stack, "mcp-papers")
        citations_session = await _open_session(stack, "mcp-citations")

        # Collect tools from both servers, mapping name → session
        tool_session: dict[str, ClientSession] = {}
        ollama_tools: list[dict] = []

        for session in (papers_session, citations_session):
            result = await session.list_tools()
            for tool in result.tools:
                tool_session[tool.name] = session
                ollama_tools.append(_mcp_tool_to_ollama(tool))

        # Build initial message list
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": request.message})

        client = ollama.AsyncClient(host=OLLAMA_BASE_URL)
        accumulated_papers: list[dict] = []

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

            # Append assistant turn with tool calls
            messages.append(
                {
                    "role": "assistant",
                    "content": full_content,
                    "tool_calls": [
                        {
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            }
                        }
                        for tc in tool_calls
                    ],
                }
            )

            # Execute each tool call via the correct MCP session
            for tc in tool_calls:
                tool_name = tc.function.name
                tool_args = tc.function.arguments or {}
                if isinstance(tool_args, str):
                    tool_args = json.loads(tool_args)

                session = tool_session.get(tool_name, papers_session)
                result = await session.call_tool(tool_name, tool_args)

                for content_item in result.content:
                    raw = getattr(content_item, "text", None)
                    if raw:
                        try:
                            papers = json.loads(raw)
                            if isinstance(papers, list):
                                accumulated_papers.extend(papers)
                        except (json.JSONDecodeError, TypeError):
                            pass

                messages.append(
                    {
                        "role": "tool",
                        "content": json.dumps(
                            [getattr(c, "text", str(c)) for c in result.content]
                        ),
                    }
                )
