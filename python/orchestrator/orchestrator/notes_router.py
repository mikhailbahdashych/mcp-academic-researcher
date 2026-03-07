import json
import os
import sqlite3
from pathlib import Path
from typing import Optional

import httpx
import sqlite_vec
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

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


def _row_to_dict(row: tuple) -> dict:
    return {
        "id": row[0],
        "title": row[1],
        "content": row[2],
        "paper_id": row[3],
        "tags": json.loads(row[4] or "[]"),
        "created_at": row[5],
        "updated_at": row[6],
    }


@router.get("")
async def list_notes(
    paper_id: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
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


@router.get("/search")
async def search_notes(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=50),
):
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
