import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import agent
from .models import ChatRequest

app = FastAPI(title="MCP Academic Researcher Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat")
async def chat(request: ChatRequest):
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
    return {"status": "ok"}


def start():
    uvicorn.run("orchestrator.main:app", host="0.0.0.0", port=8000)
