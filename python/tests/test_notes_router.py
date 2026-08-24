"""Tests for the orchestrator's notes HTTP router."""

import importlib

from fastapi import FastAPI
from fastapi.testclient import TestClient


def _client(monkeypatch, tmp_path):
    """Build a TestClient over a freshly reloaded notes_router using a tmp notes dir."""
    monkeypatch.setenv("NOTES_DIR", str(tmp_path))
    from orchestrator import notes_router

    importlib.reload(notes_router)

    async def fake_embed(_text: str) -> list[float]:
        return [0.0] * 768

    monkeypatch.setattr(notes_router, "_get_embedding", fake_embed)

    app = FastAPI()
    app.include_router(notes_router.router, prefix="/notes")
    return TestClient(app), notes_router


def test_create_and_list_note(tmp_path, monkeypatch):
    client, _ = _client(monkeypatch, tmp_path)

    resp = client.post(
        "/notes",
        json={"title": "T", "content": "C", "paper_id": "2301.00001v1", "tags": ["llm"]},
    )
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert body["title"] == "T"
    assert body["content"] == "C"
    assert body["paper_id"] == "2301.00001v1"
    assert body["tags"] == ["llm"]
    assert body["id"]
    assert body["created_at"] and body["updated_at"]

    listed = client.get("/notes")
    assert listed.status_code == 200
    assert any(n["id"] == body["id"] for n in listed.json())


def test_create_note_defaults_and_tag_filter(tmp_path, monkeypatch):
    client, _ = _client(monkeypatch, tmp_path)

    resp = client.post("/notes", json={"title": "Only title", "content": "Body"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["paper_id"] is None
    assert body["tags"] == []

    tagged = client.post("/notes", json={"title": "Tagged", "content": "Body", "tags": ["rag"]})
    assert tagged.status_code == 200, tagged.text

    filtered = client.get("/notes", params={"tags": "rag"})
    assert [n["id"] for n in filtered.json()] == [tagged.json()["id"]]


def test_create_note_rejects_empty_fields(tmp_path, monkeypatch):
    client, _ = _client(monkeypatch, tmp_path)

    assert client.post("/notes", json={"title": "", "content": "C"}).status_code == 422
    assert client.post("/notes", json={"title": "T", "content": ""}).status_code == 422


def test_create_note_returns_503_when_embedding_fails(tmp_path, monkeypatch):
    client, notes_router = _client(monkeypatch, tmp_path)

    async def boom(_text: str) -> list[float]:
        raise RuntimeError("ollama down")

    monkeypatch.setattr(notes_router, "_get_embedding", boom)

    resp = client.post("/notes", json={"title": "T", "content": "C"})
    assert resp.status_code == 503
    assert "Embedding service unavailable" in resp.json()["detail"]
