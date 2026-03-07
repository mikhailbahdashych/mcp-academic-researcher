import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx
import sqlite_vec
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")

NOTES_DIR = os.environ.get("NOTES_DIR", str(Path.home() / ".academic-researcher" / "notes"))
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
EMBED_DIM = 768


def _db_path() -> str:
    Path(NOTES_DIR).mkdir(parents=True, exist_ok=True)
    return str(Path(NOTES_DIR) / "notes.db")


def _get_conn() -> sqlite3.Connection:
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
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
        )
        resp.raise_for_status()
        return resp.json()["embedding"]


@mcp.tool()
async def save_note(
    title: str,
    content: str,
    paper_id: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    """Save a research note with semantic embedding for future retrieval."""
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    tags_json = json.dumps(tags or [])
    embedding = await _get_embedding(f"{title} {content}")

    conn = _get_conn()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO notes (id, title, content, paper_id, tags, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (note_id, title, content, paper_id, tags_json, now, now),
        )
        conn.execute(
            "DELETE FROM notes_vec WHERE note_id = ?", (note_id,)
        )
        conn.execute(
            "INSERT INTO notes_vec (note_id, embedding) VALUES (?, ?)",
            (note_id, sqlite_vec.serialize_float32(embedding)),
        )
        conn.commit()
    finally:
        conn.close()

    return {"id": note_id, "title": title, "created_at": now}


@mcp.tool()
async def get_notes(
    paper_id: str | None = None,
    tags: list[str] | None = None,
    limit: int = 20,
) -> list[dict]:
    """List saved notes, optionally filtered by paper_id or tags."""
    conn = _get_conn()
    try:
        query = "SELECT id, title, content, paper_id, tags, created_at, updated_at FROM notes"
        conditions: list[str] = []
        params: list = []

        if paper_id:
            conditions.append("paper_id = ?")
            params.append(paper_id)

        if tags:
            for tag in tags:
                conditions.append("tags LIKE ?")
                params.append(f'%"{tag}"%')

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()

    return [
        {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "paper_id": row[3],
            "tags": json.loads(row[4] or "[]"),
            "created_at": row[5],
            "updated_at": row[6],
        }
        for row in rows
    ]


@mcp.tool()
async def search_notes(query: str, limit: int = 5) -> list[dict]:
    """Semantically search notes using vector similarity."""
    embedding = await _get_embedding(query)
    serialized = sqlite_vec.serialize_float32(embedding)

    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT n.id, n.title, n.content, n.paper_id, n.tags, n.created_at, n.updated_at, v.distance
            FROM notes_vec v
            JOIN notes n ON n.id = v.note_id
            WHERE v.embedding MATCH ?
            ORDER BY v.distance
            LIMIT ?
            """,
            (serialized, limit),
        ).fetchall()
    finally:
        conn.close()

    return [
        {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "paper_id": row[3],
            "tags": json.loads(row[4] or "[]"),
            "created_at": row[5],
            "updated_at": row[6],
            "score": row[7],
        }
        for row in rows
    ]


@mcp.tool()
async def delete_note(note_id: str) -> dict:
    """Delete a note and its embedding by ID."""
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.execute("DELETE FROM notes_vec WHERE note_id = ?", (note_id,))
        conn.commit()
        deleted = cur.rowcount > 0
    finally:
        conn.close()

    return {"id": note_id, "deleted": deleted}


def main():
    mcp.run()


if __name__ == "__main__":
    main()
