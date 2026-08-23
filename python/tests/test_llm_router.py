"""Tests for the /llm HTTP endpoints.

``build_client`` is monkeypatched so no provider is ever contacted: these tests
pin the response *shapes* the frontend settings panel depends on, including the
rule that a provider failure is still an HTTP 200 carrying an ``error`` string.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from orchestrator.llm import LLMError

from orchestrator import llm_router


class FakeClient:
    """Stand-in for an ``LLMClient`` that returns canned answers (or raises)."""

    def __init__(self, models=None, reply="pong", error: Exception | None = None):
        self.model = "fake-model"
        self._models = models if models is not None else [{"id": "m1", "name": "Model One"}]
        self._reply = reply
        self._error = error

    async def list_models(self) -> list[dict]:
        if self._error:
            raise self._error
        return self._models

    async def complete(self, messages: list[dict], *, max_tokens: int = 512) -> str:
        if self._error:
            raise self._error
        return self._reply


@pytest.fixture
def api() -> TestClient:
    app = FastAPI()
    app.include_router(llm_router.router, prefix="/llm")
    return TestClient(app)


def _use(monkeypatch, factory) -> None:
    """Replace the router's ``build_client`` with ``factory``."""
    monkeypatch.setattr(llm_router, "build_client", factory)


def test_models_returns_provider_list(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient())
    response = api.post("/llm/models", json={"provider": "ollama"})
    assert response.status_code == 200
    assert response.json() == {"models": [{"id": "m1", "name": "Model One"}]}


def test_models_reports_missing_key_as_error(api, monkeypatch):
    def factory(settings):
        raise ValueError("Anthropic API key is not configured")

    _use(monkeypatch, factory)
    response = api.post("/llm/models", json={"provider": "anthropic"})
    assert response.status_code == 200
    assert response.json() == {
        "models": [],
        "error": "Anthropic API key is not configured",
    }


def test_models_reports_provider_failure_as_error(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient(error=LLMError("Ollama is not reachable")))
    body = api.post("/llm/models", json={"provider": "ollama"}).json()
    assert body["models"] == []
    assert body["error"] == "Ollama is not reachable"


def test_test_endpoint_round_trips_a_completion(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient(reply="pong"))
    body = api.post("/llm/test", json={"provider": "ollama", "model": "qwen2.5:7b"}).json()
    assert body["ok"] is True
    assert body["model"] == "fake-model"
    assert body["reply"] == "pong"
    assert isinstance(body["latency_ms"], int)
    assert body["latency_ms"] >= 0


def test_test_endpoint_truncates_a_long_reply(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient(reply="x" * 500))
    body = api.post("/llm/test", json={"provider": "ollama"}).json()
    assert body["reply"] == "x" * 200


def test_test_endpoint_reports_provider_failure(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient(error=LLMError("boom")))
    body = api.post("/llm/test", json={"provider": "anthropic"}).json()
    assert body == {"ok": False, "error": "boom"}


def test_test_endpoint_never_echoes_the_api_key(api, monkeypatch):
    _use(monkeypatch, lambda settings: FakeClient())
    response = api.post(
        "/llm/test", json={"provider": "anthropic", "api_key": "sk-super-secret"}
    )
    assert "sk-super-secret" not in response.text


def test_env_reports_key_present(api, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    assert api.get("/llm/env").json() == {"anthropic_api_key_present": True}


def test_env_reports_key_absent(api, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("CLAUDE_API_KEY", raising=False)
    assert api.get("/llm/env").json() == {"anthropic_api_key_present": False}
