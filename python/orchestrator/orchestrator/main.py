"""FastAPI application for the orchestrator.

``load_dotenv()`` deliberately runs before the local imports: those modules read
their configuration (notes directory, Ollama host, API keys) from the
environment at import time, so the .env file has to be in place first. That is
what the per-import E402 suppressions below mark.
"""

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv()

from . import agent  # noqa: E402
from .llm_router import router as llm_router  # noqa: E402
from .models import ChatRequest  # noqa: E402
from .notes_router import router as notes_router  # noqa: E402

app = FastAPI(title="MCP Academic Researcher Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(notes_router, prefix="/notes")
app.include_router(llm_router, prefix="/llm")


@app.post("/chat")
async def chat(request: ChatRequest):
    """Stream a chat response via SSE.

    Delegates to the agent module's run() async generator, which handles
    intent classification, MCP tool execution, and LLM response streaming.

    Args:
        request: ChatRequest with conversation_id, message, history, and
            optional force_tool.

    Returns:
        StreamingResponse with text/event-stream media type. Emits SSE lines:
        - data: {"type":"token","data":"..."}
        - data: {"type":"papers","data":[...]}
        - data: {"type":"done","data":null}
        - data: [DONE]
    """
    return StreamingResponse(
        agent.run(request),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
        },
    )


@app.get("/health")
async def health():
    """Health check endpoint. Returns {"status": "ok"}."""
    return {"status": "ok"}


def start():
    """Entry point for the orchestrator CLI script."""
    uvicorn.run("orchestrator.main:app", host="0.0.0.0", port=8000)
