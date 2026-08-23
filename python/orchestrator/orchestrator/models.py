"""Pydantic models for the orchestrator's HTTP API."""

from typing import Literal

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


class LLMConfig(BaseModel):
    """Which LLM provider to answer a request with.

    Mirrors :class:`orchestrator.llm.LLMSettings` field for field, so a config
    can be splatted straight into it. Every field is optional: the adapter falls
    back to its own defaults (and to the ambient environment for the Anthropic
    key and the Ollama base URL).

    Attributes:
        provider: "ollama" for a local daemon, "anthropic" for the Claude API.
        model: Model id; None picks the provider's default.
        api_key: Anthropic key; None falls back to the server environment.
        base_url: Ollama host; None falls back to OLLAMA_BASE_URL.
    """

    provider: Literal["ollama", "anthropic"] = "ollama"
    model: str | None = None
    api_key: str | None = None
    base_url: str | None = None



class ChatRequest(BaseModel):
    """Request payload for the /chat endpoint.

    The NestJS gateway sends this to the orchestrator with the full conversation
    history so the orchestrator can remain stateless.

    Attributes:
        conversation_id: UUID of the conversation.
        message: The current user message to process.
        history: Complete conversation history (all prior messages).
        force_tool: Optional directive to force a specific tool call.
        sources: Which paper sources to pre-search ("arxiv", "openalex").
            None means every available source.
        llm: Which provider/model to answer with. None means the default
            (local Ollama).
    """

    conversation_id: str
    message: str
    history: list[Message]
    force_tool: ForceTool | None = None
    sources: list[str] | None = None
    llm: LLMConfig | None = None
