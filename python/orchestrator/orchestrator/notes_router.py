import json
import os
import sqlite3
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Optional

import httpx
import sqlite_vec
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

NOTES_DIR = os.environ.get("NOTES_DIR", str(Path.home() / ".academic-researcher" / "notes"))
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
EMBED_DIM = 768


def _db_path() -> str:
    """Return the path to the notes SQLite database, creating the directory if needed."""
    Path(NOTES_DIR).mkdir(parents=True, exist_ok=True)
    return str(Path(NOTES_DIR) / "notes.db")


def _get_conn() -> sqlite3.Connection:
    """Create a SQLite connection with sqlite-vec loaded and tables auto-created."""
    conn = sqlite3.connect(_db_path())
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            paper_id TEXT,
            tags TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    conn.execute(f"""
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_vec USING vec0(
            note_id TEXT,
            embedding FLOAT[{EMBED_DIM}]
        )
    """)
    conn.commit()
    return conn


async def _get_embedding(text: str) -> list[float]:
    """Generate a 768-dimensional embedding vector via Ollama's /api/embeddings endpoint.

    Args:
        text: Text to embed.

    Returns:
        List of 768 float values representing the text embedding.

    Raises:
        httpx.HTTPStatusError: If the Ollama API returns a non-2xx status.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
        )
        resp.raise_for_status()
        return resp.json()["embedding"]


def _row_to_dict(row: tuple) -> dict:
    """Convert a SQLite row tuple to a note dictionary, parsing JSON tags."""
    return {
        "id": row[0],
        "title": row[1],
        "content": row[2],
        "paper_id": row[3],
        "tags": json.loads(row[4] or "[]"),
        "created_at": row[5],
        "updated_at": row[6],
    }


class NoteCreate(BaseModel):
    """Request body for creating a note."""

    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    paper_id: str | None = None
    tags: list[str] = []


@router.get("")
async def list_notes(
    paper_id: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """List notes with optional filters.

    Args:
        paper_id: Filter by associated paper ID.
        tags: Comma-separated tag filter (AND logic).
        limit: Maximum number of results (1-200, default 50).

    Returns:
        List of note dictionaries ordered by created_at descending.
    """
    conn = _get_conn()
    try:
        query = "SELECT id, title, content, paper_id, tags, created_at, updated_at FROM notes"
        conditions: list[str] = []
        params: list = []

        if paper_id:
            conditions.append("paper_id = ?")
            params.append(paper_id)

        if tags:
            for tag in tags.split(","):
                tag = tag.strip()
                if tag:
                    conditions.append("tags LIKE ?")
                    params.append(f'%"{tag}"%')

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()

    return [_row_to_dict(row) for row in rows]


@router.post("")
async def create_note(note: NoteCreate):
    """Create a note and index it for semantic search.

    Embeds the note's title and content via Ollama, then stores the note row
    and its embedding vector, mirroring the `save_note` MCP tool.

    Args:
        note: Title, content and optional paper_id / tags for the new note.

    Returns:
        The created note dict, in the same shape as the list endpoint.

    Raises:
        HTTPException: 503 if the embedding service is unavailable.
    """
    try:
        embedding = await _get_embedding(f"{note.title} {note.content}")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Embedding service unavailable: {e}")

    note_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()
    tags_json = json.dumps(note.tags)

    conn = _get_conn()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO notes "
            "(id, title, content, paper_id, tags, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (note_id, note.title, note.content, note.paper_id, tags_json, now, now),
        )
        conn.execute("DELETE FROM notes_vec WHERE note_id = ?", (note_id,))
        conn.execute(
            "INSERT INTO notes_vec (note_id, embedding) VALUES (?, ?)",
            (note_id, sqlite_vec.serialize_float32(embedding)),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "id": note_id,
        "title": note.title,
        "content": note.content,
        "paper_id": note.paper_id,
        "tags": note.tags,
        "created_at": now,
        "updated_at": now,
    }


@router.get("/search")
async def search_notes(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=50),
):
    """Semantic vector search over notes.

    Generates an embedding for the query via Ollama and performs KNN search
    using the sqlite-vec extension.

    Args:
        q: Search query text (minimum 1 character).
        limit: Maximum number of results (1-50, default 5).

    Returns:
        List of note dicts with an additional 'score' field (distance).

    Raises:
        HTTPException: 503 if the embedding service is unavailable.
    """
    try:
        embedding = await _get_embedding(q)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Embedding service unavailable: {e}")

    serialized = sqlite_vec.serialize_float32(embedding)

    conn = _get_conn()
    try:
        # vec0 requires 'k = ?' in WHERE clause for KNN queries (LIMIT alone fails)
        knn_rows = conn.execute(
            "SELECT note_id, distance FROM notes_vec WHERE embedding MATCH ? AND k = ?",
            (serialized, limit),
        ).fetchall()

        if not knn_rows:
            return []

        distance_map = {row[0]: row[1] for row in knn_rows}
        note_ids = list(distance_map.keys())
        placeholders = ",".join("?" * len(note_ids))
        rows = conn.execute(
            f"SELECT id, title, content, paper_id, tags, created_at, updated_at FROM notes WHERE id IN ({placeholders})",
            note_ids,
        ).fetchall()
        rows.sort(key=lambda r: distance_map.get(r[0], 0))
    finally:
        conn.close()

    return [
        {**_row_to_dict(row), "score": distance_map.get(row[0], 0)}
        for row in rows
    ]


@router.delete("/{note_id}")
async def delete_note(note_id: str):
    """Delete a note and its embedding vector by ID.

    Args:
        note_id: The note's UUID.

    Returns:
        Dict with id and deleted=True.

    Raises:
        HTTPException: 404 if the note is not found.
    """
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.execute("DELETE FROM notes_vec WHERE note_id = ?", (note_id,))
        conn.commit()
        deleted = cur.rowcount > 0
    finally:
        conn.close()

    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")

    return {"id": note_id, "deleted": True}
