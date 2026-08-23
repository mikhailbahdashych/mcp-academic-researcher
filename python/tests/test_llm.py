import pytest
from orchestrator.llm import (
    AnthropicClient,
    LLMSettings,
    OllamaClient,
    build_client,
    new_tool_call_id,
)


def test_build_client_defaults_to_ollama():
    c = build_client(None)
    assert isinstance(c, OllamaClient) and c.model == "qwen2.5:7b"


def test_build_client_anthropic_requires_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("CLAUDE_API_KEY", raising=False)
    with pytest.raises(ValueError):
        build_client(LLMSettings(provider="anthropic"))


def test_build_client_anthropic_env_fallback(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("CLAUDE_API_KEY", "sk-test")
    c = build_client(LLMSettings(provider="anthropic", model=None))
    assert isinstance(c, AnthropicClient) and c.model == "claude-opus-5"


def test_new_tool_call_id_unique():
    assert new_tool_call_id() != new_tool_call_id()


def test_anthropic_convert_messages_and_tools():
    msgs = [
        {"role": "system", "content": "SYS"},
        {"role": "user", "content": "find papers"},
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": "call_1",
                    "function": {"name": "search_arxiv", "arguments": {"query": "llm"}},
                }
            ],
        },
        {"role": "tool", "content": "[\"r1\"]", "tool_call_id": "call_1", "name": "search_arxiv"},
        {"role": "tool", "content": "[\"r2\"]", "tool_call_id": "call_1", "name": "search_arxiv"},
        {"role": "assistant", "content": "Here you go"},
    ]
    system, out = AnthropicClient._convert(msgs)
    assert system == "SYS"
    assert out[0] == {"role": "user", "content": "find papers"}
    assert (
        out[1]["role"] == "assistant"
        and out[1]["content"][0]["type"] == "tool_use"
        and out[1]["content"][0]["id"] == "call_1"
    )
    assert (
        out[2]["role"] == "user"
        and [b["type"] for b in out[2]["content"]] == ["tool_result", "tool_result"]
    )
    assert out[3] == {"role": "assistant", "content": [{"type": "text", "text": "Here you go"}]}
    tools = AnthropicClient._convert_tools(
        [
            {
                "type": "function",
                "function": {
                    "name": "t",
                    "description": "d",
                    "parameters": {"type": "object", "properties": {}},
                },
            }
        ]
    )
    assert tools == [
        {"name": "t", "description": "d", "input_schema": {"type": "object", "properties": {}}}
    ]


def test_anthropic_convert_inserts_leading_user_when_needed():
    msgs = [
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [{"id": "c", "function": {"name": "x", "arguments": {}}}],
        }
    ]
    _, out = AnthropicClient._convert(msgs)
    assert out[0]["role"] == "user"


@pytest.mark.asyncio
async def test_ollama_stream_yields_text_and_tool_calls(monkeypatch):
    class FakeFn:  # mimics ollama chunk.message.tool_calls[i].function
        name = "search_arxiv"
        arguments = {"query": "q"}

    class FakeTC:
        function = FakeFn()

    class Msg:
        def __init__(self, content=None, tool_calls=None):
            self.content, self.tool_calls = content, tool_calls

    class Chunk:
        def __init__(self, m):
            self.message = m

    async def fake_chat(**kwargs):
        async def gen():
            yield Chunk(Msg(content="Hel"))
            yield Chunk(Msg(content="lo"))
            yield Chunk(Msg(tool_calls=[FakeTC()]))

        return gen()

    c = OllamaClient(model="m", base_url="http://x")
    monkeypatch.setattr(c._client, "chat", fake_chat)
    events = [e async for e in c.stream([{"role": "user", "content": "hi"}], tools=[])]
    assert "".join(e.text for e in events if e.text) == "Hello"
    tcs = [e.tool_call for e in events if e.tool_call]
    assert (
        len(tcs) == 1
        and tcs[0].name == "search_arxiv"
        and tcs[0].arguments == {"query": "q"}
        and tcs[0].id.startswith("call_")
    )


@pytest.mark.asyncio
async def test_anthropic_stream_yields_text_then_tool_calls(monkeypatch):
    """Beyond the brief: covers the Anthropic streaming path end to end."""

    class Delta:
        def __init__(self, text):
            self.type, self.text = "text_delta", text

    class Event:
        def __init__(self, text):
            self.type, self.delta = "content_block_delta", Delta(text)

    class ToolUseBlock:
        type, id, name, input = "tool_use", "toolu_1", "save_note", {"title": "t"}

    class FinalMessage:
        content = [ToolUseBlock()]

    captured = {}

    class FakeStream:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        def __aiter__(self):
            async def gen():
                yield Event("Hel")
                yield Event("lo")

            return gen()

        async def get_final_message(self):
            return FinalMessage()

    def fake_stream(**kwargs):
        captured.update(kwargs)
        return FakeStream()

    c = AnthropicClient(model="claude-opus-5", api_key="sk-test")
    monkeypatch.setattr(c._client.messages, "stream", fake_stream)

    messages = [{"role": "system", "content": "SYS"}, {"role": "user", "content": "hi"}]
    tools = [{"type": "function", "function": {"name": "save_note", "parameters": {}}}]
    events = [e async for e in c.stream(messages, tools=tools)]

    assert "".join(e.text for e in events if e.text) == "Hello"
    tcs = [e.tool_call for e in events if e.tool_call]
    assert len(tcs) == 1
    assert tcs[0].id == "toolu_1"
    assert tcs[0].name == "save_note"
    assert tcs[0].arguments == {"title": "t"}
    # system is hoisted out of messages; tools are converted to input_schema form
    assert captured["system"] == "SYS"
    assert captured["messages"] == [{"role": "user", "content": "hi"}]
    assert captured["tools"][0]["input_schema"] == {"type": "object", "properties": {}}
    assert "thinking" not in captured


@pytest.mark.asyncio
async def test_anthropic_stream_omits_empty_tools(monkeypatch):
    class FakeStream:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        def __aiter__(self):
            async def gen():
                return
                yield  # pragma: no cover - makes gen() an async generator

            return gen()

        async def get_final_message(self):
            class Final:
                content = []

            return Final()

    captured = {}

    def fake_stream(**kwargs):
        captured.update(kwargs)
        return FakeStream()

    c = AnthropicClient(model="claude-opus-5", api_key="sk-test")
    monkeypatch.setattr(c._client.messages, "stream", fake_stream)
    assert [e async for e in c.stream([{"role": "user", "content": "hi"}], tools=[])] == []
    assert "tools" not in captured
    assert "system" not in captured
