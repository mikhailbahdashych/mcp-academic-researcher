# Python -- Orchestrator and MCP Servers

The Python layer contains the FastAPI orchestrator and three MCP (Model Context Protocol) servers. The orchestrator acts as the MCP host, spawning each server as a stdio subprocess, coordinating tool calls with the LLM the request names -- a local Ollama model or Anthropic's Claude -- and streaming responses back to the NestJS gateway.

The orchestrator is **stateless with respect to the provider**: every `/chat` request carries its own `llm` block, so which model answers is a gateway decision, not a deployment one.

[Back to project root](../README.md)

---

## Table of Contents

- [Workspace Structure](#workspace-structure)
- [Orchestrator](#orchestrator)
  - [FastAPI Application](#fastapi-application)
  - [Agent Module](#agent-module)
  - [LLM Provider Adapter](#llm-provider-adapter)
  - [LLM Router](#llm-router)
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
├── .env                            # OPENALEX_API_KEY, ANTHROPIC_API_KEY / CLAUDE_API_KEY
├── orchestrator/                   # FastAPI orchestrator
│   ├── pyproject.toml              # Dependencies: fastapi, mcp, ollama, anthropic, httpx, etc.
│   └── orchestrator/
│       ├── __init__.py
│       ├── main.py                 # FastAPI app with /chat and /health endpoints
│       ├── agent.py                # Agentic loop: intent classification + tool execution
│       ├── llm.py                  # Provider adapters: OllamaClient / AnthropicClient
│       ├── llm_router.py           # REST endpoints backing the settings page
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

### Dependency Pins

`mcp` is pinned to `>=1.25.0,<2` in the orchestrator **and** in all three MCP server packages. MCP 2.0 removed `mcp.server.fastmcp`, which every server here imports -- allowing the major bump would break all of them at import time.

The orchestrator additionally depends on `anthropic>=1.0.0` alongside `ollama>=0.4.0`; both providers are always installed, and which one runs is decided per request.

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

#### LLM endpoints

Mounted at `/llm` prefix via `llm_router`. See [LLM Router](#llm-router).

#### Application configuration

- CORS: allows all origins (internal service)
- No authentication (gateway handles auth)
- Default port: 8000
- `load_dotenv()` runs **before** the local imports, because those modules read their configuration (notes directory, Ollama host, API keys) from the environment at import time. That is what the per-import `# noqa: E402` suppressions in `main.py` mark

---

### Agent Module

**File:** `orchestrator/orchestrator/agent.py`

The agent module implements the core agentic loop that coordinates MCP tool calls with the LLM. This is the most complex component in the system.

It holds no provider configuration of its own: it builds a client from the request's `llm` block via `build_client()` (see [LLM Provider Adapter](#llm-provider-adapter)) and uses that **one** client for both the intent classifier and the tool loop, so a request answered by Claude is also classified by Claude.

#### Constants

| Name | Value | Description |
|------|-------|-------------|
| `SYSTEM_PROMPT` | _(long string)_ | Instructions for the LLM to act as an academic research assistant, including the `[n]` inline-citation convention |
| `DEFAULT_MAX_RESULTS` | `5` | Default number of papers to return |
| `PRE_SEARCH_TOOLS` | `["search_arxiv", "search_openalex"]` | Paper-search tools that can be pre-called; a request names them by suffix. Also the only tools whose results may enter the sources list |
| `NOTE_TOOL_NAMES` | `{save_note, get_notes, search_notes, delete_note}` | Notes-server tools. Notes carry a `title` like papers do, so they are excluded from the sources rail |
| `SEARCH_TOOL_NAMES` | `{search_arxiv, search_openalex, search_notes}` | Excluded from the LLM's tool list after a pre-search, so it cannot re-run them |
| `MAX_TOOL_ITERATIONS` | `8` | Ceiling on LLM round trips per request, so a tool-calling loop cannot run away |

#### `run(request: ChatRequest) -> AsyncGenerator[str, None]`

The main entry point. An async generator that yields SSE-formatted strings.

**Flow:**

1. **Open MCP sessions**: Spawns three stdio subprocesses (`mcp-papers`, `mcp-citations`, `mcp-notes`) and initializes MCP client sessions with each
2. **Build tool registry**: Lists all tools from all servers and builds a `tool_session` map (`tool_name -> ClientSession`) plus an `all_tools` list of tool schemas in the canonical format
3. **Initialize message history**: Prepends the system prompt and adds all messages from `request.history`
4. **Build the LLM client**: `build_client(LLMSettings(**request.llm.model_dump()) if request.llm else None)` -- a missing `llm` block means local Ollama with the adapter's defaults
5. **Intent classification** (if no forced tool): Calls `_extract_search_query()` with that same client, *before* appending the current message, so the classifier's recent-context window does not see it twice
6. **Handle forced tool call** (if `request.force_tool` is set): Calls the specified tool directly via MCP and appends the result. A failure is still recorded as a call/result pair -- a dangling tool call is a protocol error for Anthropic
7. **Pre-search** (if search intent detected):
   - Calls the search tools selected by `_select_search_tools(request.sources, ...)` with the extracted query parameters. One dead source does not sink the answer the other found
   - Calls `search_notes` to retrieve related prior notes for context
   - Appends all results as tool call + tool response messages to the history
8. **LLM loop**: Streams the LLM response, handling any additional tool calls the model decides to make, up to `MAX_TOOL_ITERATIONS`
   - If the model returns tool calls, executes them via MCP and loops back
   - If not, breaks out
9. **Yield SSE events**: Tokens are yielded as they arrive from the LLM stream, then the deduplicated papers and the `done` / `[DONE]` sentinels

Papers are kept in two buckets. `presearch_papers` come from the classifier's guess at a query; `loop_papers` come from searches the model ran deliberately after seeing the results. The final `papers` event emits `_dedup_papers(loop_papers + presearch_papers, requested_max_results)`, so the model's own searches lead the list and are what survives a `max_results` cap.

A provider failure (`LLMError`, or a `ValueError` from an unconfigured key) is reported as answer text prefixed with a warning sign, not as an SSE `error` event -- the frontend treats an `error` event as a dropped stream. The exception is logged without the provider settings, which carry the API key.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `request` | `ChatRequest` | The chat request with message, history, and optional `force_tool`, `sources`, and `llm` |

**Yields:** `str` -- SSE-formatted lines (`data: {...}\n\n`)

#### `_select_search_tools(sources, available) -> list[str]`

Picks the pre-search tools to run for the sources a request asked for.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `sources` | `list[str] \| None` | Source suffixes (`"arxiv"`, `"openalex"`), matched case- and whitespace-insensitively. `None` means every source |
| `available` | `Container[str]` | Tool names the connected MCP servers actually offer |

**Returns:** Tool names to pre-call, in the stable order of `PRE_SEARCH_TOOLS`. An unknown source name selects nothing rather than raising.

#### `_extract_search_query(client, message, history) -> SearchIntent | None`

LLM-based intent classifier that determines whether a user message is requesting a paper search. It runs on the request's own provider, via `client.complete(..., max_tokens=256)`.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `client` | `LLMClient` | The provider client built for this request |
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

#### `_mcp_tool_to_canonical(tool) -> dict`

Converts an MCP tool schema to the orchestrator's canonical tool format, which each provider adapter then translates for its own API.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `tool` | MCP `Tool` object | Tool with `name`, `description`, `inputSchema` |

**Returns:** `dict` in canonical tool format:
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

#### `_build_tool_exchange(tool_name, tool_args, result_texts) -> tuple[dict, dict]`

Records an already-executed tool call (a forced call or a pre-search) as an assistant/tool message pair sharing a freshly minted call id. Providers require every tool result to name the call it answers, so the two messages must be appended together, in that order.

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

### LLM Provider Adapter

**File:** `orchestrator/orchestrator/llm.py`

Gives the orchestrator one LLM interface regardless of backend. `agent.py` speaks a single **canonical** message/tool dialect (Ollama-shaped dicts), and this module translates it for whichever provider is configured.

Canonical messages:

```python
{"role": "system",    "content": str}
{"role": "user",      "content": str}
{"role": "assistant", "content": str,
 "tool_calls": [{"id": str, "function": {"name": str, "arguments": dict}}]}
{"role": "tool",      "content": str, "tool_call_id": str, "name": str}
```

#### Constants

| Name | Value | Description |
|------|-------|-------------|
| `DEFAULT_OLLAMA_MODEL` | `qwen2.5:7b` | Model used when a request names none |
| `DEFAULT_OLLAMA_BASE_URL` | `http://localhost:11434` | Fallback host, after `$OLLAMA_BASE_URL` |
| `DEFAULT_ANTHROPIC_MODEL` | `claude-opus-5` | Model used when a request names none |
| `ANTHROPIC_STREAM_MAX_TOKENS` | `16000` | Output budget for streamed Claude responses |
| `ANTHROPIC_MIN_COMPLETE_MAX_TOKENS` | `4096` | Floor for non-streamed Claude budgets |

The floor exists because current Claude models think adaptively and thinking tokens bill against `max_tokens` -- a caller asking for 16 tokens can otherwise get back zero *text* blocks, which reads as an empty answer rather than an error. Ollama has no such tax, so the floor lives in the adapter rather than in the callers.

#### `LLMSettings`

```python
@dataclass
class LLMSettings:
    provider: Provider = "ollama"        # "ollama" | "anthropic"
    model: str | None = None
    api_key: str | None = field(default=None, repr=False)  # anthropic only
    base_url: str | None = None                            # ollama only
```

`api_key` is declared `repr=False`, which keeps the key out of reprs, f-strings, and traceback locals. `LLMSettings` crosses an HTTP boundary, so the safe thing is the default.

#### `LLMClient` protocol

The surface `agent.py` depends on, implemented by both adapters:

| Member | Signature | Description |
|--------|-----------|-------------|
| `model` | `str` | The model id in use |
| `complete` | `(messages, *, max_tokens=512) -> str` | Full assistant text; no tools, no streaming |
| `stream` | `(messages, tools) -> AsyncIterator[StreamEvent]` | Text deltas and tool calls |
| `list_models` | `() -> list[dict]` | `[{"id": str, "name": str}]` |

A `StreamEvent` carries either a `text` delta or a completed `tool_call` (`ToolCall(id, name, arguments)`).

#### `OllamaClient(model, base_url)`

Ollama's own wire format *is* the canonical format, so messages and tools pass through untouched. Ollama does not id its tool calls, so `new_tool_call_id()` mints one -- the agent needs an id to pair results with calls. Transport failures, `ollama.ResponseError`, and malformed responses are translated into `LLMError` with a user-facing message (e.g. `Ollama is not reachable at <base_url>`).

#### `AnthropicClient(model, api_key)`

Translates canonical messages into the Anthropic Messages API: system messages are hoisted out and joined into the `system` parameter, assistant tool calls become `tool_use` blocks, and tool results become `tool_result` blocks inside a `user` message, with consecutive results merged (the API rejects a bare `tool` role and expects results batched). A conversation that would start with an assistant message gets a synthetic `(conversation start)` user message, since the API requires the first message to be from the user.

Streaming yields text deltas live; `tool_use` inputs only arrive complete on the final message, so tool calls are emitted after the stream closes. SDK failures become `LLMError` with a readable message (`Anthropic rejected the API key`, `Anthropic rate limit reached, try again shortly`, and so on). `list_models()` returns only ids starting with `claude-`.

#### `build_client(settings) -> LLMClient`

Builds the client for `settings`, defaulting to local Ollama when `settings` is `None`.

**Raises:** `ValueError` for an unknown provider, or for Anthropic with no resolvable key.

#### `env_anthropic_key() -> str | None`

Reads the Anthropic key from the environment, honouring both spellings: `ANTHROPIC_API_KEY` first, then `CLAUDE_API_KEY`. Used as the fallback when a request carries no key of its own.

---

### LLM Router

**File:** `orchestrator/orchestrator/llm_router.py`

REST endpoints backing the frontend's LLM provider settings panel, mounted at `/llm` in the FastAPI app.

**Every endpoint answers HTTP 200.** A provider that is misconfigured, unreachable, or rejecting the key is a *result* the settings panel renders inline, not a transport failure. Responses carry an `error` string rather than a status code -- and never echo the submitted API key back. Failures are logged with the provider name only.

#### `POST /llm/models`

Lists the models the configured provider offers.

**Request body:** `LLMConfig` (see [Pydantic Models](#pydantic-models))

**Returns:** `{"models": [{"id", "name"}, ...]}`, or `{"models": [], "error": str}` when the provider cannot be reached or is not configured.

#### `POST /llm/test`

Round-trips one tiny completion (`"Reply with the single word: pong"`, `max_tokens=16`) to prove the provider actually answers.

**Request body:** `LLMConfig`

**Returns:** `{"ok": true, "model", "latency_ms", "reply"}` on success, with the reply truncated to 200 characters; otherwise `{"ok": false, "error": str}`.

#### `GET /llm/env`

Reports whether the server already holds an Anthropic key: `{"anthropic_api_key_present": bool}`. This lets the settings panel offer "use the server's key" without ever sending the key itself to the browser.

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

#### `POST /notes`

Creates a note and indexes it for semantic search, mirroring the `save_note` MCP tool. Backs the "Save note" action in the UI, which reaches it through the gateway's `POST /api/notes`.

**Request body:** `NoteCreate`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `str` | _(required)_ | Note title, min length 1 |
| `content` | `str` | _(required)_ | Note body, min length 1 |
| `paper_id` | `str \| None` | `None` | Comma-separated paper IDs the note refers to |
| `tags` | `list[str]` | `[]` | Tag strings |

**Implementation:**
1. Embeds `"{title} {content}"` via `_get_embedding()`
2. Inserts the note row and its embedding vector, replacing any row with the same id

**Returns:** The created note dict, in the same shape as the list endpoint.

**Raises:** `HTTPException(503)` if the embedding service is unavailable. The gateway turns this into its own 503 rather than a generic 500.

#### `GET /notes/search`

Semantic vector search over notes.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `q` | `string` | _(required)_ | Search query text |
| `limit` | `int` | `5` | Maximum results (1-50) |

**Returns:** `list[dict]` -- Note objects with an additional `score` field (distance from query embedding; lower is more similar).

**Implementation:**
1. Generates an embedding for the query via Ollama's `/api/embed` endpoint
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

Generates a 768-dimensional embedding vector via Ollama's `/api/embed` endpoint using the model specified by `EMBED_MODEL`. It uses the same endpoint and payload as the notes MCP server's `_get_embedding`, so notes and queries embedded here land on the same (L2-normalized) scale as the ones written by the MCP tool -- both share the `notes_vec` index.

**Embeddings always need Ollama.** Anthropic has no embeddings API, so this call goes to Ollama even when chat is answered by Claude. Saving and searching notes fails without a reachable Ollama daemon and a pulled `EMBED_MODEL`.

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

#### `LLMConfig`

```python
class LLMConfig(BaseModel):
    provider: Literal["ollama", "anthropic"] = "ollama"
    model: str | None = None      # None picks the provider's default
    api_key: str | None = None    # None falls back to the server environment
    base_url: str | None = None   # None falls back to OLLAMA_BASE_URL
```

Mirrors `orchestrator.llm.LLMSettings` field for field, so a config can be splatted straight into it. This is also the request body of both `POST /llm/models` and `POST /llm/test`.

#### `ChatRequest`

```python
class ChatRequest(BaseModel):
    conversation_id: str          # Conversation UUID
    message: str                  # Current user message
    history: list[Message]        # Full conversation history
    force_tool: ForceTool | None = None  # Optional forced tool call
    sources: list[str] | None = None     # "arxiv", "openalex"; None means all
    llm: LLMConfig | None = None         # None means the default (local Ollama)
```

The gateway sends this with the full conversation history *and* the provider to answer it with, so the orchestrator can remain stateless in both respects.

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
- **Note:** The notes router uses the same endpoint and payload, so both writers share the `notes_vec` index on one scale. Embeddings always go to Ollama -- Anthropic has no embeddings API -- so notes save/search needs a running Ollama daemon even when chat is answered by Claude.

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
    source: str  # "arxiv" | "openalex"
```

---

## Environment Variables

| Variable | Default | Used By | Description |
|----------|---------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | LLM adapter, Notes server, Notes router | Ollama API base URL. For chat it is only a fallback -- a request's `llm.base_url` wins |
| `EMBED_MODEL` | `nomic-embed-text` | Notes server, Notes router | Ollama embedding model name |
| `NOTES_DIR` | `~/.academic-researcher/notes` | Notes server, Notes router | Directory for notes SQLite database |
| `OPENALEX_API_KEY` | _(none)_ | Papers server, Citations server | Optional API key for higher OpenAlex rate limits |
| `ANTHROPIC_API_KEY` | _(none)_ | LLM adapter, LLM router | Anthropic key used when a request carries none. Checked first |
| `CLAUDE_API_KEY` | _(none)_ | LLM adapter, LLM router | Alternative spelling of the same key. Checked second |

The two Anthropic spellings are both read by `env_anthropic_key()`; whichever is set acts as the fallback for requests without a key, and is what `GET /llm/env` reports on. The key itself is never returned by any endpoint and never logged.

Chat provider settings normally arrive per request from the NestJS gateway, which stores them in its own database -- see the [Backend README](../backend/README.md#prisma-schema). The environment variables above are the fallback for when nothing is stored.

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

Ollama is required either way: `nomic-embed-text` powers note embeddings even when chat is answered by Claude. To answer chats with Claude instead of `qwen2.5:7b`, set the provider on the app's Settings page, or put `ANTHROPIC_API_KEY` (or `CLAUDE_API_KEY`) in `python/.env` as a fallback.

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
