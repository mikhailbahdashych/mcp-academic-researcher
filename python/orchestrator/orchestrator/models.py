"""Pydantic models for the orchestrator's HTTP API."""

from pydantic import BaseModel


class Message(BaseModel):
    """A single message in the conversation history.

    Attributes:
        role: Message author -- "user" for human input, "assistant" for LLM responses.
        content: Text content of the message.
    """

    role: str
    content: str


class ForceTool(BaseModel):
    """Directive to force a specific MCP tool call instead of LLM-driven tool selection.

    Used by the frontend to trigger citation/reference lookups directly.

    Attributes:
        name: MCP tool name (e.g., "get_citations", "get_references").
        args: Tool arguments as a dictionary.
    """

    name: str
    args: dict


class ChatRequest(BaseModel):
    """Request payload for the /chat endpoint.

    The NestJS gateway sends this to the orchestrator with the full conversation
    history so the orchestrator can remain stateless.

    Attributes:
        conversation_id: UUID of the conversation.
        message: The current user message to process.
        history: Complete conversation history (all prior messages).
        force_tool: Optional directive to force a specific tool call.
        sources: Paper sources to search ("arxiv", "openalex"); None means all.
    """

    conversation_id: str
    message: str
    history: list[Message]
    force_tool: ForceTool | None = None
    sources: list[str] | None = None
