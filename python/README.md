# Python -- Orchestrator and MCP Servers

The Python layer contains the FastAPI orchestrator and three MCP (Model Context Protocol) servers. The orchestrator acts as the MCP host, spawning each server as a stdio subprocess, coordinating tool calls with the Ollama LLM, and streaming responses back to the NestJS gateway.

[Back to project root](../README.md)

---

## Table of Contents

- [Workspace Structure](#workspace-structure)
- [Orchestrator](#orchestrator)
  - [FastAPI Application](#fastapi-application)
  - [Agent Module](#agent-module)
  - [Notes Router](#notes-router)
  - [Pydantic Models](#pydantic-models)
- [MCP Servers](#mcp-servers)
  - [Papers Server](#papers-server)
  - [Notes Server](#notes-server)
  - [Citations Server](#citations-server)
- [Shared Package](#shared-package)
- [Environment Variables](#environment-variables)
- [MCP Stdio Transport](#mcp-stdio-transport)
- [Development Setup](#development-setup)

---

## Workspace Structure

The Python directory is a `uv` workspace with five members:

```
python/
├── pyproject.toml                  # Workspace root (members, ruff, pytest config)
├── .env                            # OPENALEX_API_KEY
├── orchestrator/                   # FastAPI orchestrator
│   ├── pyproject.toml              # Dependencies: fastapi, mcp, ollama, httpx, etc.
│   └── orchestrator/
│       ├── __init__.py
│       ├── main.py                 # FastAPI app with /chat and /health endpoints
│       ├── agent.py                # Agentic loop: intent classification + tool execution
│       ├── models.py               # Pydantic request/response models
│       └── notes_router.py         # REST endpoints for notes CRUD + vector search
├── mcp_servers/
│   ├── papers/                     # Papers search MCP server
│   │   ├── pyproject.toml          # Dependencies: mcp, httpx
│   │   └── papers/
│   │       ├── __init__.py
│   │       └── server.py           # search_arxiv, search_openalex tools
│   ├── notes/                      # Notes management MCP server
│   │   ├── pyproject.toml          # Dependencies: mcp, httpx, sqlite-vec
│   │   └── notes/
│   │       ├── __init__.py
│   │       └── server.py           # save_note, get_notes, search_notes, delete_note tools
│   └── citations/                  # Citations MCP server
│       ├── pyproject.toml          # Dependencies: mcp, httpx
│       └── citations/
│           ├── __init__.py
│           └── server.py           # get_citations, get_references tools
└── shared/                         # Shared Pydantic models
    ├── pyproject.toml
    └── shared/
        ├── __init__.py
        └── models.py               # Paper model
```

### Workspace Configuration

**File:** `pyproject.toml` (root)

```toml
[tool.uv.workspace]
members = [
    "orchestrator",
    "mcp_servers/papers",
    "mcp_servers/notes",
    "mcp_servers/citations",
    "shared",
]
```

Each member defines a CLI entry point via `[project.scripts]`:
- `orchestrator` -> `orchestrator.main:start`
- `mcp-papers` -> `papers.server:main`
- `mcp-notes` -> `notes.server:main`
- `mcp-citations` -> `citations.server:main`

---

## Orchestrator

### FastAPI Application

**File:** `orchestrator/orchestrator/main.py`

The FastAPI application serves as the HTTP interface for the NestJS backend.

#### `POST /chat`

Main chat endpoint. Accepts a `ChatRequest` body and returns a `StreamingResponse` with SSE events.

**Request body:** `ChatRequest` (see [Pydantic Models](#pydantic-models))

**Response:** `text/event-stream` with SSE lines:
```
data: {"type":"token","data":"text"}\n\n
data: {"type":"papers","data":[...]}\n\n
data: {"type":"done","data":null}\n\n
data: [DONE]\n\n
```

The endpoint delegates to `agent.run(request)`, which is an async generator yielding SSE-formatted strings.

#### `GET /health`

Health check endpoint. Returns `{"status": "ok"}`.

#### Notes endpoints

Mounted at `/notes` prefix via `notes_router`. See [Notes Router](#notes-router).

#### Application configuration

- CORS: allows all origins (internal service)
- No authentication (gateway handles auth)
- Default port: 8000

---

### Agent Module

**File:** `orchestrator/orchestrator/agent.py`

The agent module implements the core agentic loop that coordinates MCP tool calls with the Ollama LLM. This is the most complex component in the system.

#### Constants

| Name | Value | Description |
|------|-------|-------------|
| `OLLAMA_BASE_URL` | `$OLLAMA_BASE_URL` or `http://localhost:11434` | Ollama API base URL |
| `MODEL` | `qwen2.5:7b` | Default LLM model for chat and intent classification |
| `SYSTEM_PROMPT` | _(long string)_ | Instructions for the LLM to act as an academic research assistant |
| `DEFAULT_MAX_RESULTS` | `5` | Default number of papers to return |

#### `run(request: ChatRequest) -> AsyncGenerator[str, None]`

The main entry point. An async generator that yields SSE-formatted strings.

**Flow:**

1. **Open MCP sessions**: Spawns three stdio subprocesses (`mcp-papers`, `mcp-citations`, `mcp-notes`) and initializes MCP client sessions with each
2. **Build tool registry**: Lists all tools from all servers and builds a `tool_session` map (`tool_name -> ClientSession`) plus an `ollama_tools` list of tool schemas in Ollama format
3. **Initialize message history**: Prepends the system prompt and adds all messages from `request.history`
4. **Handle forced tool call** (if `request.force_tool` is set): Calls the specified tool directly via MCP, appends the result to history, and skips intent classification
5. **Intent classification** (if no forced tool): Calls `_extract_search_query()` to determine if the user's message is a paper search request
6. **Pre-search** (if search intent detected):
   - Calls `search_arxiv` and `search_openalex` with the extracted query parameters
   - Calls `search_notes` to retrieve related prior notes for context
   - Appends all results as tool call + tool response messages to the history
7. **LLM loop**: Streams the LLM response, handling any additional tool calls the model decides to make
   - If the model returns `tool_calls`, executes them via MCP and loops back
   - If no `tool_calls`, emits the accumulated papers and `done` event, then exits
8. **Yield SSE events**: Tokens are yielded as they arrive from the LLM stream

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `request` | `ChatRequest` | The chat request with message, history, and optional force_tool |

**Yields:** `str` -- SSE-formatted lines (`data: {...}\n\n`)

#### `_extract_search_query(client, message, history) -> SearchIntent | None`

LLM-based intent classifier that determines whether a user message is requesting a paper search.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `client` | `ollama.AsyncClient` | Ollama async client |
| `message` | `str` | The user's current message |
| `history` | `list[dict]` | Full message history (uses last 6 for context) |

**Returns:** `SearchIntent` if the message is a search request, `None` otherwise.

**Implementation:**
- Sends a structured prompt to the LLM asking it to classify the message and extract search parameters
- Parses the LLM response using regex to extract `SEARCH`, `QUERY`, `MAX_RESULTS`, `SORT_BY_DATE`, `YEAR_FROM`, and `YEAR_TO` fields
- Clamps `MAX_RESULTS` to the range [1, 20]
- Returns `None` for non-search requests (note-saving, summarizing, follow-up questions)

#### `SearchIntent`

Dataclass for extracted search parameters:

```python
@dataclass
class SearchIntent:
    query: str                    # Clean topic keywords (no dates)
    max_results: int = 5          # Number of papers to return
    sort_by_date: bool = False    # Whether to sort by recency
    year_from: int | None = None  # Start year filter
    year_to: int | None = None    # End year filter
```

#### `_open_session(stack, bin_name) -> ClientSession`

Opens an MCP client session by spawning a subprocess.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `stack` | `AsyncExitStack` | Context manager stack for cleanup |
| `bin_name` | `str` | Executable name (e.g., `mcp-papers`) |

**Returns:** Initialized `ClientSession` ready for tool calls.

**Implementation:** Resolves the binary path relative to the current Python executable's directory (handles virtual environments), then uses `stdio_client()` from the MCP SDK to establish a JSON-RPC connection over stdin/stdout.

#### `_mcp_tool_to_ollama(tool) -> dict`

Converts an MCP tool schema to Ollama's tool format.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `tool` | MCP `Tool` object | Tool with `name`, `description`, `inputSchema` |

**Returns:** `dict` in Ollama tool format:
```python
{
    "type": "function",
    "function": {
        "name": tool.name,
        "description": tool.description,
        "parameters": tool.inputSchema,
    },
}
```

#### `_parse_papers(result) -> list[dict]`

Extracts paper dictionaries from an MCP tool call result.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `result` | MCP `CallToolResult` | The result from `session.call_tool()` |

**Returns:** `list[dict]` of paper objects parsed from the result's text content.

**Implementation:** Iterates over `result.content` items, extracts the `text` attribute, and parses JSON. Handles both single objects and arrays.

#### `_dedup_papers(papers, limit?) -> list[dict]`

Deduplicates papers by normalized title (lowercase, stripped).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `papers` | `list[dict]` | Raw list of paper dicts |
| `limit` | `int \| None` | Maximum number of papers to return |

**Returns:** Deduplicated list, preserving first occurrence order.

#### SSE Helper Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `_sse_token(text)` | `str -> str` | Formats a token event: `data: {"type":"token","data":"..."}\n\n` |
| `_sse_papers(papers)` | `list[dict] -> str` | Formats a papers event: `data: {"type":"papers","data":[...]}\n\n` |
| `_sse_done()` | `() -> str` | Formats a done event: `data: {"type":"done","data":null}\n\n` |

#### `_resolve_bin(name) -> str`

Resolves a binary name to an absolute path within the current virtual environment.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `name` | `str` | Binary name (e.g., `mcp-papers`) |

**Returns:** Absolute path if found in the venv's bin directory, otherwise the bare name (fallback to PATH).

---

### Notes Router

**File:** `orchestrator/orchestrator/notes_router.py`

REST API router for notes management, mounted at `/notes` in the FastAPI app. Uses SQLite with the `sqlite-vec` extension for vector similarity search.

#### Database Schema

Two tables in `$NOTES_DIR/notes.db`:

**`notes` table:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `title` | `TEXT NOT NULL` | Note title |
| `content` | `TEXT NOT NULL` | Note body |
| `paper_id` | `TEXT` | Associated paper IDs (comma-separated) |
| `tags` | `TEXT` | JSON-serialized array of tag strings |
| `created_at` | `TEXT` | ISO timestamp |
| `updated_at` | `TEXT` | ISO timestamp |

**`notes_vec` virtual table (sqlite-vec):**
| Column | Type | Description |
|--------|------|-------------|
| `note_id` | `TEXT` | Foreign key to `notes.id` |
| `embedding` | `FLOAT[768]` | 768-dimensional float32 embedding vector |

#### `GET /notes`

Lists notes with optional filters.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `paper_id` | `string` | `None` | Filter by paper ID |
| `tags` | `string` | `None` | Comma-separated tags (AND filter) |
| `limit` | `int` | `50` | Maximum results (1-200) |

**Returns:** `list[dict]` -- Note objects ordered by `created_at DESC`.

#### `GET /notes/search`

Semantic vector search over notes.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `q` | `string` | _(required)_ | Search query text |
| `limit` | `int` | `5` | Maximum results (1-50) |

**Returns:** `list[dict]` -- Note objects with an additional `score` field (distance from query embedding; lower is more similar).

**Implementation:**
1. Generates an embedding for the query via Ollama's `/api/embeddings` endpoint
2. Performs KNN search on the `notes_vec` virtual table using `MATCH` with `k = limit`
3. Fetches full note records for the matched IDs
4. Sorts results by distance (ascending)

**Raises:** `HTTPException(503)` if the embedding service is unavailable.

#### `DELETE /notes/{note_id}`

Deletes a note and its embedding vector.

**Raises:** `HTTPException(404)` if the note is not found.

**Returns:** `{"id": note_id, "deleted": true}`

#### Internal Functions

##### `_get_conn() -> sqlite3.Connection`

Returns a SQLite connection with `sqlite-vec` loaded and tables created if they do not exist.

##### `_get_embedding(text: str) -> list[float]`

Generates a 768-dimensional embedding vector via Ollama's `/api/embeddings` endpoint using the model specified by `EMBED_MODEL`.

##### `_row_to_dict(row: tuple) -> dict`

Converts a SQLite row tuple to a note dictionary, parsing the JSON `tags` field.

---

### Pydantic Models

**File:** `orchestrator/orchestrator/models.py`

#### `Message`

```python
class Message(BaseModel):
    role: str       # "user" | "assistant"
    content: str
```

#### `ForceTool`

```python
class ForceTool(BaseModel):
    name: str       # MCP tool name (e.g., "get_citations")
    args: dict      # Tool arguments
```

#### `ChatRequest`

```python
class ChatRequest(BaseModel):
    conversation_id: str          # Conversation UUID
    message: str                  # Current user message
    history: list[Message]        # Full conversation history
    force_tool: ForceTool | None = None  # Optional forced tool call
```

---

## MCP Servers

Each MCP server is a standalone Python package that exposes tools via the MCP protocol over stdio. They are spawned as subprocesses by the orchestrator's agent module.

### Papers Server

**Package:** `mcp-papers` (entry point: `mcp-papers`)
**File:** `mcp_servers/papers/papers/server.py`

Searches for academic papers on arXiv and OpenAlex.

#### `search_arxiv(query, max_results?, sort_by_date?, year_from?, year_to?) -> list[dict]`

Searches academic papers on the arXiv API.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `str` | _(required)_ | Search query string |
| `max_results` | `int` | `5` | Maximum number of results |
| `sort_by_date` | `bool` | `False` | Sort by submission date (descending) |
| `year_from` | `int \| None` | `None` | Filter: only papers published in or after this year |
| `year_to` | `int \| None` | `None` | Filter: only papers published in or before this year |

**Returns:** `list[dict]` -- Paper objects with fields: `id` (arXiv ID), `title`, `authors`, `abstract`, `year`, `url`, `source` ("arxiv").

**Implementation:**
- Sends an HTTP GET request to `https://export.arxiv.org/api/query`
- When year filtering is active, fetches `max_results * 4` results to ensure enough papers survive the filter
- Parses the Atom XML response using `xml.etree.ElementTree`
- Extracts paper metadata including arXiv ID from the entry URL

#### `search_openalex(query, max_results?, sort_by_date?, year_from?, year_to?) -> list[dict]`

Searches academic papers on the OpenAlex API.

**Parameters:** Same as `search_arxiv`.

**Returns:** `list[dict]` -- Paper objects with fields: `id` (DOI or OpenAlex URL), `title`, `authors`, `abstract` (reconstructed from inverted index), `year`, `url`, `source` ("openalex").

**Implementation:**
- Sends an HTTP GET request to `https://api.openalex.org/works`
- Uses the `search` parameter for text search
- Applies year filters via the `filter` parameter (e.g., `publication_year:2022-2024`)
- Includes `OPENALEX_API_KEY` from environment if available
- Reconstructs abstracts from OpenAlex's inverted index format via `_reconstruct_abstract()`

#### Internal Functions

##### `_reconstruct_abstract(inverted_index: dict | None) -> str`

OpenAlex stores abstracts as `{word: [position, ...]}` dictionaries. This function reconstructs the plain text by sorting words by position.

##### `_in_year_range(year, year_from, year_to) -> bool`

Checks whether a publication year falls within the specified range.

---

### Notes Server

**Package:** `mcp-notes` (entry point: `mcp-notes`)
**File:** `mcp_servers/notes/notes/server.py`

Manages research notes with SQLite storage and vector embeddings for semantic search.

#### `save_note(title, content, paper_id?, tags?) -> dict`

Saves a research note with a semantic embedding for future retrieval.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `str` | _(required)_ | Note title |
| `content` | `str` | _(required)_ | Note body text |
| `paper_id` | `str \| None` | `None` | Associated paper IDs (exact IDs from search results, comma-separated) |
| `tags` | `list[str] \| None` | `None` | List of tag strings |

**Returns:** `dict` with `id`, `title`, `created_at`.

**Implementation:**
1. Generates a UUID for the note
2. Computes an embedding of `"{title} {content}"` via Ollama's `/api/embed` endpoint
3. Inserts the note into the `notes` table
4. Inserts the embedding into the `notes_vec` virtual table
5. Uses `INSERT OR REPLACE` for idempotency

#### `get_notes(paper_id?, tags?, limit?) -> list[dict]`

Lists saved notes with optional filters.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `paper_id` | `str \| None` | `None` | Filter by paper ID |
| `tags` | `list[str] \| None` | `None` | Filter by tags (AND logic, uses SQL LIKE) |
| `limit` | `int` | `20` | Maximum results |

**Returns:** `list[dict]` -- Note objects ordered by `created_at DESC`.

#### `search_notes(query, limit?) -> list[dict]`

Semantically searches notes using vector similarity.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `str` | _(required)_ | Search text |
| `limit` | `int` | `5` | Maximum results |

**Returns:** `list[dict]` -- Note objects with an additional `score` field (vector distance).

**Implementation:**
1. Generates an embedding for the query
2. Performs KNN search on `notes_vec` using `embedding MATCH ? AND k = ?`
3. Fetches full note records and sorts by distance

#### `delete_note(note_id) -> dict`

Deletes a note and its embedding vector by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `note_id` | `str` | The note's UUID |

**Returns:** `{"id": note_id, "deleted": bool}` -- `deleted` is `True` if a row was actually removed.

#### Database Details

- **Location:** `$NOTES_DIR/notes.db` (default: `~/.academic-researcher/notes/notes.db`)
- **Vector extension:** `sqlite-vec` for KNN similarity search
- **Embedding model:** `nomic-embed-text` (768-dimensional vectors) via Ollama `/api/embed`
- **Note:** The notes server uses `/api/embed` (new Ollama API), while the notes router uses `/api/embeddings` (legacy Ollama API). Both work, but the endpoints differ.

---

### Citations Server

**Package:** `mcp-citations` (entry point: `mcp-citations`)
**File:** `mcp_servers/citations/citations/server.py`

Retrieves citation relationships between academic papers using the OpenAlex API.

#### `get_citations(paper_id, max_results?) -> list[dict]`

Gets papers that cite the given paper.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `paper_id` | `str` | _(required)_ | Paper identifier (OpenAlex ID, DOI, or arXiv ID) |
| `max_results` | `int` | `5` | Maximum number of citing papers to return |

**Returns:** `list[dict]` -- Paper objects with fields: `id`, `title`, `authors`, `abstract` (empty), `year`, `url`, `source` ("openalex").

**Implementation:**
- Queries OpenAlex with `filter=cites:{paper_id}`
- Returns papers that reference the given paper in their bibliography

#### `get_references(paper_id, max_results?) -> list[dict]`

Gets papers referenced by the given paper (its bibliography).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `paper_id` | `str` | _(required)_ | Paper identifier (OpenAlex ID, DOI, or arXiv ID) |
| `max_results` | `int` | `5` | Maximum number of referenced papers to return |

**Returns:** `list[dict]` -- Paper objects.

**Implementation:**
1. Fetches the paper's `referenced_works` list from OpenAlex
2. Takes the first `max_results` referenced work IDs
3. Fetches details for those works in a second API call using `filter=openalex_id:{id1|id2|...}`

#### Internal Functions

##### `_api_params(extra?) -> dict`

Builds common query parameters, injecting `OPENALEX_API_KEY` from environment if set.

##### `_parse_work(item: dict) -> dict`

Converts an OpenAlex work object to a flat paper dictionary. Extracts DOI, authors from `authorships`, publication year, and landing page URL from `primary_location`.

---

## Shared Package

**File:** `shared/shared/models.py`

Shared Pydantic model for paper objects:

```python
class Paper(BaseModel):
    id: str
    title: str
    authors: list[str]
    abstract: str
    year: int | None = None
    url: str
    source: str  # "arxiv" | "semantic_scholar"
```

---

## Environment Variables

| Variable | Default | Used By | Description |
|----------|---------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Orchestrator, Notes server, Notes router | Ollama API base URL |
| `EMBED_MODEL` | `nomic-embed-text` | Notes server, Notes router | Ollama embedding model name |
| `NOTES_DIR` | `~/.academic-researcher/notes` | Notes server, Notes router | Directory for notes SQLite database |
| `OPENALEX_API_KEY` | _(none)_ | Papers server, Citations server | Optional API key for higher OpenAlex rate limits |

---

## MCP Stdio Transport

The orchestrator communicates with MCP servers via **stdio** (standard input/output) using JSON-RPC 2.0 messages. This is the transport mechanism:

1. The orchestrator spawns each MCP server as a subprocess using `StdioServerParameters`
2. The server reads JSON-RPC requests from `stdin` and writes responses to `stdout`
3. The MCP SDK handles message framing, serialization, and protocol negotiation
4. Each server process lives for the duration of a single chat request (opened in `run()` via `AsyncExitStack`)

**Binary resolution:** The `_resolve_bin()` function checks if the binary exists in the current Python venv's `bin/` directory (e.g., `/app/.venv/bin/mcp-papers`). If not found, it falls back to the bare name, relying on `PATH` resolution.

**Entry points:** Each server defines a `[project.scripts]` entry in its `pyproject.toml`:
- `mcp-papers` -> `papers.server:main` (calls `mcp.run()`)
- `mcp-notes` -> `notes.server:main`
- `mcp-citations` -> `citations.server:main`

---

## Development Setup

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- Ollama running with `qwen2.5:7b` and `nomic-embed-text` models

### Installation

```bash
cd python
uv sync --all-packages
```

This installs all workspace members and their dependencies in a single virtual environment.

### Running the Orchestrator

```bash
# From project root
npm run orchestrator

# Or from the python directory
uv run uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000 --reload
```

The orchestrator is available at [http://localhost:8000](http://localhost:8000).

### Linting

```bash
cd python
uv run ruff check .
```

### Testing

```bash
cd python
uv run pytest
```

### Ruff Configuration

From `pyproject.toml`:
- Line length: 100
- Target version: Python 3.11
- Selected rules: `E` (pycodestyle errors), `F` (pyflakes), `I` (isort), `UP` (pyupgrade)
