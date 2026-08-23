"""End-to-end tests for ``agent.run()`` against fake MCP sessions and a fake LLM.

``run()`` carries three invariants that only appear once the whole generator is
driven, and that the unit tests on its helpers cannot see:

(a) the user's message precedes the assistant/tool pairs (Anthropic rejects a
    conversation that opens with an assistant turn),
(b) every assistant ``tool_calls[].id`` is answered by a tool message carrying
    the same ``tool_call_id``,
(c) a provider failure still closes the stream as papers -> done -> [DONE], with
    the message as answer text and no ``error`` event (the frontend drops the
    answer bubble when it sees one).

Nothing here spawns a subprocess or opens a socket: ``_open_session`` and
``build_client`` are both monkeypatched.
"""

import copy
import json
from types import SimpleNamespace

from orchestrator.llm import LLMError, StreamEvent, ToolCall
from orchestrator.models import ChatRequest

from orchestrator import agent

PAPER = {"id": "2301.00001v1", "title": "A Fake Paper", "source": "arxiv"}

NO_SEARCH = "SEARCH: no\nQUERY:\nMAX_RESULTS: 5\nSORT_BY_DATE: no\nYEAR_FROM:\nYEAR_TO:"
YES_SEARCH = "SEARCH: yes\nQUERY: llm\nMAX_RESULTS: 5\nSORT_BY_DATE: no\nYEAR_FROM:\nYEAR_TO:"

TOOL_NAMES = ["search_arxiv", "search_openalex", "search_notes", "get_citations"]


def _tool(name: str) -> SimpleNamespace:
    return SimpleNamespace(
        name=name,
        description=f"{name} tool",
        inputSchema={"type": "object", "properties": {}},
    )


def _result(payload) -> SimpleNamespace:
    return SimpleNamespace(content=[SimpleNamespace(text=json.dumps(payload))])


class FakeSession:
    """Stands in for all three MCP servers and records every tool it is asked to run."""

    def __init__(self, names: list[str] = TOOL_NAMES) -> None:
        self._tools = [_tool(n) for n in names]
        self.calls: list[tuple[str, dict]] = []

    async def list_tools(self):
        return SimpleNamespace(tools=self._tools)

    async def call_tool(self, name: str, args: dict):
        self.calls.append((name, args))
        if name in ("search_arxiv", "search_openalex"):
            return _result([PAPER])
        return _result({"ok": name})

    @property
    def call_names(self) -> list[str]:
        return [name for name, _ in self.calls]


class FakeLLM:
    """Scripted client: ``complete`` classifies, ``stream`` replays one turn per call."""

    model = "fake-model"

    def __init__(self, classifier_reply: str, script: list[list[StreamEvent]]) -> None:
        self.classifier_reply = classifier_reply
        self._script = list(script)
        # `run()` mutates one messages list in place, so snapshot each turn.
        self.seen_messages: list[list[dict]] = []
        self.seen_tools: list[list[dict]] = []

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        return self.classifier_reply

    async def stream(self, messages: list[dict], tools: list[dict]):
        self.seen_messages.append(copy.deepcopy(messages))
        self.seen_tools.append(copy.deepcopy(tools))
        if not self._script:
            raise AssertionError("run() called stream() more times than the script allows")
        for event in self._script.pop(0):
            yield event


class FailingLLM:
    """Classifies fine, then fails the way a misconfigured provider would."""

    model = "fake-model"

    def __init__(self, exc: Exception) -> None:
        self._exc = exc

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        return NO_SEARCH

    async def stream(self, messages: list[dict], tools: list[dict]):
        raise self._exc
        yield  # unreachable; makes this an async generator like the real one


def _install(monkeypatch, llm, session: FakeSession) -> None:
    async def fake_open_session(stack, bin_name):
        return session

    monkeypatch.setattr(agent, "_open_session", fake_open_session)
    monkeypatch.setattr(agent, "build_client", lambda settings: llm)


def _request(message: str, **kwargs) -> ChatRequest:
    return ChatRequest(conversation_id="c1", message=message, history=[], **kwargs)


async def _events(request: ChatRequest) -> list[tuple[str, object]]:
    """Drive ``run()`` and parse its SSE lines into (type, data) pairs."""
    chunks = [chunk async for chunk in agent.run(request)]
    out: list[tuple[str, object]] = []
    for chunk in chunks:
        payload = chunk.removeprefix("data: ").strip()
        if payload == "[DONE]":
            out.append(("[DONE]", None))
        else:
            event = json.loads(payload)
            out.append((event["type"], event["data"]))
    return out


def _assert_closes_cleanly(events: list[tuple[str, object]]) -> None:
    """Every run ends papers -> done -> [DONE], exactly once each, with no error."""
    types = [t for t, _ in events]
    assert "error" not in types
    assert types.count("papers") == 1
    assert types.count("done") == 1
    assert types[-3:] == ["papers", "done", "[DONE]"]
    assert set(types[:-3]) <= {"token"}


async def test_run_orders_messages_and_pairs_tool_call_ids(monkeypatch):
    """Invariants (a) and (b), as the model itself sees them on its second turn."""
    session = FakeSession()
    llm = FakeLLM(
        NO_SEARCH,
        [
            [
                StreamEvent(text="Checking. "),
                StreamEvent(
                    tool_call=ToolCall(
                        id="call_abc", name="get_citations", arguments={"paper_id": "x"}
                    )
                ),
            ],
            [StreamEvent(text="Done.")],
        ],
    )
    _install(monkeypatch, llm, session)

    events = await _events(_request("Who cites this?"))

    _assert_closes_cleanly(events)
    assert "".join(d for t, d in events if t == "token") == "Checking. Done."
    assert session.call_names == ["get_citations"]
    assert len(llm.seen_messages) == 2, "the loop should stop once no tool calls come back"

    messages = llm.seen_messages[1]
    user_idx = next(
        i
        for i, m in enumerate(messages)
        if m["role"] == "user" and m["content"] == "Who cites this?"
    )
    assistant_idx = next(i for i, m in enumerate(messages) if m.get("tool_calls"))
    tool_idx = next(i for i, m in enumerate(messages) if m["role"] == "tool")

    # (a) the user's message comes first, then the call, then its result.
    assert user_idx < assistant_idx < tool_idx
    # (b) the result names the call that produced it.
    assert messages[assistant_idx]["tool_calls"][0]["id"] == "call_abc"
    assert messages[tool_idx]["tool_call_id"] == "call_abc"
    assert messages[tool_idx]["name"] == "get_citations"


async def test_run_pre_searches_only_the_requested_source(monkeypatch):
    """`sources` filters the pre-search, and the papers still reach the client."""
    session = FakeSession()
    llm = FakeLLM(YES_SEARCH, [[StreamEvent(text="Found one paper.")]])
    _install(monkeypatch, llm, session)

    events = await _events(_request("Find papers on llm", sources=["arxiv"]))

    _assert_closes_cleanly(events)
    # search_openalex is filtered out; the notes pre-fetch still runs.
    assert session.call_names == ["search_arxiv", "search_notes"]
    assert next(d for t, d in events if t == "papers") == [PAPER]

    messages = llm.seen_messages[0]
    user_idx = next(i for i, m in enumerate(messages) if m["role"] == "user")
    first_call_idx = next(i for i, m in enumerate(messages) if m.get("tool_calls"))
    assert user_idx < first_call_idx

    # Every pre-search result is paired with the call above it.
    for i, m in enumerate(messages):
        if m.get("tool_calls"):
            assert messages[i + 1]["tool_call_id"] == m["tool_calls"][0]["id"]

    # After a pre-search the model must not be offered the search tools again.
    offered = {t["function"]["name"] for t in llm.seen_tools[0]}
    assert offered == {"get_citations"}


async def test_run_forced_tool_runs_before_the_model_and_after_the_user(monkeypatch):
    """The forced-tool branch skips the classifier but keeps the same ordering."""
    session = FakeSession()
    llm = FakeLLM(NO_SEARCH, [[StreamEvent(text="Here are the citations.")]])
    _install(monkeypatch, llm, session)

    request = _request(
        "Show citations",
        force_tool={"name": "get_citations", "args": {"paper_id": "2301.00001v1"}},
    )
    events = await _events(request)

    _assert_closes_cleanly(events)
    assert session.call_names == ["get_citations"]

    messages = llm.seen_messages[0]
    user_idx = next(i for i, m in enumerate(messages) if m["role"] == "user")
    call_idx = next(i for i, m in enumerate(messages) if m.get("tool_calls"))
    assert user_idx < call_idx
    assert messages[call_idx + 1]["tool_call_id"] == messages[call_idx]["tool_calls"][0]["id"]
    assert messages[call_idx]["tool_calls"][0]["function"]["name"] == "get_citations"


async def test_run_reports_a_provider_failure_as_answer_text(monkeypatch):
    """Invariant (c): the message is a token, and the stream still closes normally."""
    session = FakeSession()
    _install(monkeypatch, FailingLLM(LLMError("boom")), session)

    events = await _events(_request("hi"))

    _assert_closes_cleanly(events)
    assert [t for t, _ in events] == ["token", "papers", "done", "[DONE]"]
    assert events[0][1] == "⚠️ boom"


async def test_run_reports_a_missing_api_key_as_answer_text(monkeypatch):
    """A ValueError from build_client reads as user-facing text, not a crash."""
    session = FakeSession()

    async def fake_open_session(stack, bin_name):
        return session

    def boom(settings):
        raise ValueError("Anthropic API key is not configured")

    monkeypatch.setattr(agent, "_open_session", fake_open_session)
    monkeypatch.setattr(agent, "build_client", boom)

    events = await _events(_request("hi"))

    _assert_closes_cleanly(events)
    assert events[0] == ("token", "⚠️ Anthropic API key is not configured")
