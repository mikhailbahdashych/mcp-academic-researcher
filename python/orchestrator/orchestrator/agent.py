import json
import os
import sys
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
    "academic papers from arXiv and Semantic Scholar. "
    "After searching, summarize the key findings and present the papers you found. "
    "Always search before answering research questions."
)


def _mcp_tool_to_ollama(tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.inputSchema,
        },
    }


def _resolve_mcp_papers_bin() -> str:
    """Find the mcp-papers executable in the current venv."""
    venv_bin = Path(sys.executable).parent
    candidate = venv_bin / "mcp-papers"
    if candidate.exists():
        return str(candidate)
    # Fallback: let shell PATH resolve it
    return "mcp-papers"


def _sse_token(text: str) -> str:
    return f"data: {json.dumps({'type': 'token', 'data': text})}\n\n"


def _sse_papers(papers: list[dict]) -> str:
    return f"data: {json.dumps({'type': 'papers', 'data': papers})}\n\n"


def _sse_done() -> str:
    return f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"


async def run(request: ChatRequest) -> AsyncGenerator[str, None]:
    mcp_bin = _resolve_mcp_papers_bin()
    server_params = StdioServerParameters(command=mcp_bin, args=[])

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools_result = await session.list_tools()
            ollama_tools = [_mcp_tool_to_ollama(t) for t in tools_result.tools]

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

                # Execute each tool call via MCP
                for tc in tool_calls:
                    tool_name = tc.function.name
                    tool_args = tc.function.arguments or {}
                    if isinstance(tool_args, str):
                        tool_args = json.loads(tool_args)

                    result = await session.call_tool(tool_name, tool_args)

                    # Parse papers from result content
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
                                [
                                    getattr(c, "text", str(c))
                                    for c in result.content
                                ]
                            ),
                        }
                    )
