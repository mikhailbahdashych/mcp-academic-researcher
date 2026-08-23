"""Provider adapters that give the orchestrator one LLM interface.

The orchestrator speaks a single *canonical* message/tool dialect (the
Ollama-style dicts ``agent.py`` already builds) and this module translates it
for whichever backend is configured:

- :class:`OllamaClient` — local models over ``ollama.AsyncClient``.
- :class:`AnthropicClient` — Claude models over ``anthropic.AsyncAnthropic``.

Canonical messages::

    {"role": "system",    "content": str}
    {"role": "user",      "content": str}
    {"role": "assistant", "content": str,
     "tool_calls": [{"id": str, "function": {"name": str, "arguments": dict}}]}
    {"role": "tool",      "content": str, "tool_call_id": str, "name": str}

Canonical tools::

    {"type": "function",
     "function": {"name": str, "description": str, "parameters": <json schema>}}
"""

from __future__ import annotations

import json
import os
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any, Literal, Protocol

import anthropic
import httpx
import ollama

Provider = Literal["ollama", "anthropic"]

DEFAULT_OLLAMA_MODEL = "qwen2.5:7b"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_ANTHROPIC_MODEL = "claude-opus-5"

#: Output budget for streamed Anthropic responses (summaries can be long).
ANTHROPIC_STREAM_MAX_TOKENS = 16000

#: Anthropic error types worth translating into a user-facing message.
#: ``AuthenticationError`` and ``RateLimitError`` both subclass ``APIStatusError``.
_ANTHROPIC_ERRORS = (anthropic.APIConnectionError, anthropic.APIStatusError)

#: Ollama failures that mean "the daemon answered badly" or "it is not there".
_OLLAMA_ERRORS = (ollama.ResponseError, httpx.ConnectError)


class LLMError(RuntimeError):
    """A provider failure with a message that is safe to show to the user."""


@dataclass
class LLMSettings:
    """Which provider to talk to, and how."""

    provider: Provider = "ollama"
    model: str | None = None
    api_key: str | None = None  # anthropic only
    base_url: str | None = None  # ollama only


@dataclass
class ToolCall:
    """A tool invocation requested by the model."""

    id: str
    name: str
    arguments: dict


@dataclass
class StreamEvent:
    """One streamed unit: either a text delta or a completed tool call."""

    text: str | None = None
    tool_call: ToolCall | None = None


class LLMClient(Protocol):
    """The surface ``agent.py`` depends on, regardless of provider."""

    model: str

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        """Return the full assistant text for ``messages`` (no tools, no streaming)."""
        ...

    def stream(self, messages: list[dict], tools: list[dict]) -> AsyncIterator[StreamEvent]:
        """Stream text deltas and tool calls for ``messages``."""
        ...

    async def list_models(self) -> list[dict]:
        """Return the models this provider offers as ``[{"id": str, "name": str}]``."""
        ...


def new_tool_call_id() -> str:
    """Mint an id for a tool call the provider did not name itself (Ollama)."""
    return "call_" + uuid.uuid4().hex[:16]


def env_anthropic_key() -> str | None:
    """Read the Anthropic key from the environment, honouring both spellings."""
    return os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("CLAUDE_API_KEY") or None


def _ollama_error(exc: Exception, base_url: str) -> LLMError:
    """Translate an Ollama/httpx failure into a user-facing :class:`LLMError`."""
    if isinstance(exc, ollama.ResponseError):
        return LLMError(getattr(exc, "error", None) or str(exc))
    return LLMError(f"Ollama is not reachable at {base_url}")


def _anthropic_error(exc: Exception) -> LLMError:
    """Translate an Anthropic SDK failure into a user-facing :class:`LLMError`."""
    if isinstance(exc, anthropic.AuthenticationError):
        return LLMError("Anthropic rejected the API key")
    if isinstance(exc, anthropic.RateLimitError):
        return LLMError("Anthropic rate limit reached, try again shortly")
    if isinstance(exc, anthropic.APIConnectionError):
        return LLMError("Could not reach the Anthropic API")
    if isinstance(exc, anthropic.APIStatusError):
        return LLMError(f"Anthropic API error {exc.status_code}: {exc.message}")
    return LLMError(str(exc))


class OllamaClient:
    """Canonical-format adapter over a local Ollama daemon.

    Ollama's own wire format *is* the canonical format, so messages and tools
    pass through untouched. ``ollama._types.Message`` silently drops the extra
    ``id`` / ``tool_call_id`` / ``name`` keys the canonical format carries for
    Anthropic's benefit.
    """

    def __init__(self, model: str, base_url: str) -> None:
        self.model = model
        self.base_url = base_url
        self._client = ollama.AsyncClient(host=base_url)

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        """Return the assistant text for a one-shot, non-streaming call.

        ``max_tokens`` is accepted for interface parity with
        :class:`AnthropicClient`; Ollama's own output limit applies instead.
        """
        try:
            response = await self._client.chat(
                model=self.model,
                messages=messages,
                stream=False,
            )
        except _OLLAMA_ERRORS as exc:
            raise _ollama_error(exc, self.base_url) from exc
        return response.message.content or ""

    async def stream(
        self, messages: list[dict], tools: list[dict]
    ) -> AsyncIterator[StreamEvent]:
        """Yield text deltas as they arrive, then any tool calls in the chunk."""
        try:
            response = await self._client.chat(
                model=self.model,
                messages=messages,
                tools=tools,
                stream=True,
            )
            async for chunk in response:
                message = chunk.message
                if message.content:
                    yield StreamEvent(text=message.content)
                for call in message.tool_calls or ():
                    yield StreamEvent(tool_call=self._to_tool_call(call))
        except _OLLAMA_ERRORS as exc:
            raise _ollama_error(exc, self.base_url) from exc

    @staticmethod
    def _to_tool_call(call: Any) -> ToolCall:
        """Normalise one Ollama tool call, parsing JSON-string arguments."""
        name = call.function.name
        arguments = call.function.arguments
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments) if arguments.strip() else {}
            except json.JSONDecodeError as exc:
                raise LLMError(f"Ollama returned malformed arguments for {name}") from exc
        # Ollama does not id its tool calls; the agent needs one to pair results.
        return ToolCall(id=new_tool_call_id(), name=name, arguments=dict(arguments or {}))

    async def list_models(self) -> list[dict]:
        """Return the models pulled into the local Ollama daemon."""
        try:
            response = await self._client.list()
        except _OLLAMA_ERRORS as exc:
            raise _ollama_error(exc, self.base_url) from exc
        return [{"id": m.model, "name": m.model} for m in response.models if m.model]


class AnthropicClient:
    """Canonical-format adapter over the Anthropic Messages API."""

    def __init__(self, model: str, api_key: str) -> None:
        self.model = model
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    @staticmethod
    def _convert(messages: list[dict]) -> tuple[str | None, list[dict]]:
        """Split canonical messages into an Anthropic system prompt + message list.

        System messages are hoisted out and joined. Assistant tool calls become
        ``tool_use`` blocks; tool results become ``tool_result`` blocks inside a
        ``user`` message, with consecutive results merged into a single message
        (the API rejects a bare ``tool`` role and expects results batched).
        """
        system_parts: list[str] = []
        out: list[dict] = []

        for message in messages:
            role = message.get("role")
            content = message.get("content") or ""

            if role == "system":
                if content.strip():
                    system_parts.append(content)
            elif role == "user":
                if content.strip():
                    out.append({"role": "user", "content": content})
            elif role == "assistant":
                blocks: list[dict] = []
                if content.strip():
                    blocks.append({"type": "text", "text": content})
                for call in message.get("tool_calls") or ():
                    function = call.get("function") or {}
                    blocks.append(
                        {
                            "type": "tool_use",
                            "id": call.get("id") or new_tool_call_id(),
                            "name": function.get("name", ""),
                            "input": function.get("arguments") or {},
                        }
                    )
                if blocks:
                    out.append({"role": "assistant", "content": blocks})
            elif role == "tool":
                block = {
                    "type": "tool_result",
                    "tool_use_id": message.get("tool_call_id") or "",
                    "content": content,
                }
                if AnthropicClient._ends_with_tool_results(out):
                    out[-1]["content"].append(block)
                else:
                    out.append({"role": "user", "content": [block]})

        # The API requires the first message to be from the user.
        if out and out[0]["role"] == "assistant":
            out.insert(0, {"role": "user", "content": "(conversation start)"})

        return ("\n\n".join(system_parts) if system_parts else None), out

    @staticmethod
    def _ends_with_tool_results(out: list[dict]) -> bool:
        """True when the last built message is a user message of tool results."""
        if not out or out[-1]["role"] != "user":
            return False
        content = out[-1]["content"]
        return bool(content) and isinstance(content, list) and content[-1]["type"] == "tool_result"

    @staticmethod
    def _convert_tools(tools: list[dict]) -> list[dict]:
        """Turn canonical function tools into Anthropic tool definitions."""
        converted: list[dict] = []
        for tool in tools:
            function = tool.get("function") or {}
            converted.append(
                {
                    "name": function.get("name", ""),
                    "description": function.get("description") or "",
                    "input_schema": function.get("parameters")
                    or {"type": "object", "properties": {}},
                }
            )
        return converted

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        """Return the concatenated text blocks of a one-shot, non-streaming call."""
        system, converted = self._convert(messages)
        kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": converted,
        }
        if system:
            kwargs["system"] = system
        try:
            response = await self._client.messages.create(**kwargs)
        except _ANTHROPIC_ERRORS as exc:
            raise _anthropic_error(exc) from exc
        return "".join(block.text for block in response.content if block.type == "text")

    async def stream(
        self, messages: list[dict], tools: list[dict]
    ) -> AsyncIterator[StreamEvent]:
        """Yield text deltas live, then the tool calls found in the final message."""
        system, converted = self._convert(messages)
        converted_tools = self._convert_tools(tools)
        kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": ANTHROPIC_STREAM_MAX_TOKENS,
            "messages": converted,
        }
        if system:
            kwargs["system"] = system
        if converted_tools:
            kwargs["tools"] = converted_tools

        try:
            async with self._client.messages.stream(**kwargs) as stream:
                async for event in stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        yield StreamEvent(text=event.delta.text)
                # tool_use inputs only arrive complete on the final message.
                final = await stream.get_final_message()
                for block in final.content:
                    if block.type == "tool_use":
                        yield StreamEvent(
                            tool_call=ToolCall(
                                id=block.id,
                                name=block.name,
                                arguments=dict(block.input or {}),
                            )
                        )
        except _ANTHROPIC_ERRORS as exc:
            raise _anthropic_error(exc) from exc

    async def list_models(self) -> list[dict]:
        """Return the Claude models this API key can reach."""
        try:
            page = await self._client.models.list(limit=100)
        except _ANTHROPIC_ERRORS as exc:
            raise _anthropic_error(exc) from exc
        return [
            {"id": m.id, "name": m.display_name or m.id}
            for m in page.data
            if m.id.startswith("claude-")
        ]


def build_client(settings: LLMSettings | None) -> LLMClient:
    """Build the client for ``settings``, defaulting to local Ollama.

    Raises:
        ValueError: for an unknown provider, or Anthropic with no resolvable key.
    """
    settings = settings or LLMSettings()

    if settings.provider == "anthropic":
        api_key = settings.api_key or env_anthropic_key()
        if not api_key:
            raise ValueError("Anthropic API key is not configured")
        return AnthropicClient(
            model=settings.model or DEFAULT_ANTHROPIC_MODEL,
            api_key=api_key,
        )

    if settings.provider != "ollama":
        raise ValueError(f"Unknown LLM provider: {settings.provider!r}")

    return OllamaClient(
        model=settings.model or DEFAULT_OLLAMA_MODEL,
        base_url=settings.base_url
        or os.environ.get("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL),
    )
