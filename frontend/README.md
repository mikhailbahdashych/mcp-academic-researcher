# Frontend -- Angular Application

The frontend is an Angular 17 single-page application built with standalone components, Angular Material, and a signal-based state management approach. It provides a chat interface for academic research queries with real-time SSE streaming, paper source browsing, session history, notes management, and an LLM provider settings page.

[Back to project root](../README.md)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Component Tree](#component-tree)
- [Routing](#routing)
- [Core Services](#core-services)
- [Data Models](#data-models)
- [Page Components](#page-components)
- [Layout Components](#layout-components)
- [Shared Components](#shared-components)
- [Path Aliases](#path-aliases)
- [Theming and Styling](#theming-and-styling)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Development Setup](#development-setup)
- [Available Scripts](#available-scripts)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  AppComponent (MatSidenav shell)                                  │
│  ├── SidebarComponent (240px)                                     │
│  │   ├── SidebarHeaderComponent (logo)                           │
│  │   ├── Nav links (New thread ⌘K, History, Notes, Settings)     │
│  │   ├── SessionListComponent ("Library", grouped by date)       │
│  │   │   └── SessionItemComponent (per session)                  │
│  │   └── SidebarFooterComponent (theme toggle, collapse)         │
│  ├── TopBarComponent (mobile only)                               │
│  └── <router-outlet> ─────────────────────────────────────────┐  │
│      ├── HomeComponent (hero + composer)                       │  │
│      │   ├── QueryInputComponent (hero)                        │  │
│      │   └── SuggestedTopicsComponent                          │  │
│      ├── ResearchComponent                                     │  │
│      │   ├── AnswerPanelComponent                              │  │
│      │   │   ├── MessageThreadComponent                        │  │
│      │   │   │   └── MessageBubbleComponent                    │  │
│      │   │   │       ├── MarkdownViewerComponent               │  │
│      │   │   │       └── StreamingCursorComponent              │  │
│      │   │   └── QueryInputComponent (follow-up)               │  │
│      │   └── SourcesPanelComponent (380px rail)                │  │
│      │       └── PaperCardComponent                            │  │
│      ├── HistoryComponent                                      │  │
│      │   └── (inline session rows)                             │  │
│      ├── NotesComponent                                        │  │
│      │   └── NoteCardComponent                                 │  │
│      └── SettingsComponent                                     │  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Tree

### Page Components

| Component | Route | Description |
|-----------|-------|-------------|
| `HomeComponent` | `/` | Landing hero with the composer and suggested topics |
| `ResearchComponent` | `/research/:sessionId` | Answer thread plus the sources rail |
| `HistoryComponent` | `/history` | Searchable list of past sessions |
| `NotesComponent` | `/notes` | Notes browser with semantic search |
| `SettingsComponent` | `/settings` | LLM provider settings: provider, model, base URL, API key |

### Layout Components

| Component | Description |
|-----------|-------------|
| `AppComponent` | Root shell with `MatSidenav` container, responsive layout |
| `SidebarComponent` | 240px navigation sidebar with collapsible state |
| `SidebarHeaderComponent` | Logo, linking back to home |
| `SessionListComponent` | Grouped session list under a "Library" label (Today, Yesterday, This Week, Older) |
| `SessionItemComponent` | Single session link with delete button |
| `SidebarFooterComponent` | Theme toggle and sidebar collapse toggle, pinned to the bottom |
| `TopBarComponent` | Mobile-only toolbar with menu toggle and theme switch |

### Shared Components

| Component | Description |
|-----------|-------------|
| `QueryInputComponent` | The composer: auto-resizing textarea with Cmd+K shortcut, arXiv/OpenAlex scope chips, active-model chip, Enter to submit |
| `PaperCardComponent` | Paper metadata card with citation copy, URL open, citation/reference lookup |

---

## Routing

All routes use lazy loading via `loadComponent()`. Defined in `src/app/app.routes.ts`:

```typescript
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'research/:sessionId',
    loadComponent: () =>
      import('./pages/research/research.component').then(m => m.ResearchComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'notes',
    loadComponent: () =>
      import('./pages/notes/notes.component').then(m => m.NotesComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
```

---

## Core Services

### `SessionService`

**File:** `src/app/core/services/session.service.ts`

Signal-based session state manager. Acts as the single source of truth for conversation sessions on the client side. Hydrates from backend on startup, caches to `localStorage`, and syncs mutations back to the backend.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `sessions` | `Signal<ChatSession[]>` | Read-only list of all sessions |
| `activeSession` | `Signal<ChatSession \| undefined>` | Currently active session (computed) |

**Public Methods:**

#### `createSession(query: string): ChatSession`

Creates a new session with a client-generated UUID. Fires a `POST /api/conversations` request to the backend in the background (fire-and-forget). The user message is added as the first message. Navigation to the session is handled by the caller.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `query` | `string` | The initial user query, also used as the session title |

**Returns:** `ChatSession` -- the newly created session object.

#### `setActiveSession(id: string): void`

Sets the active session by ID. Used by `AnswerPanelComponent` when navigating to a research page.

#### `getSession(id: string): ChatSession | undefined`

Retrieves a session by ID from the in-memory signal store.

#### `deleteSession(id: string): void`

Deletes a session locally and sends a `DELETE /api/conversations/:id` request to the backend. Clears the active session if it was the deleted one.

#### `clearAll(): void`

Removes all sessions from memory and `localStorage`.

#### `addUserMessage(sessionId: string, content: string): void`

Appends a user message to the specified session and persists to `localStorage`.

#### `addAssistantMessage(sessionId: string): string`

Creates a placeholder assistant message with `isStreaming: true` and returns its generated UUID. Used to start accumulating streamed tokens.

#### `appendToken(sessionId: string, messageId: string, token: string): void`

Appends a text token to an in-progress assistant message. Called by `AnswerPanelComponent` for each `token` SSE event. Does not persist to `localStorage` (performance optimization during streaming).

#### `finalizeMessage(sessionId: string, messageId: string): void`

Sets `isStreaming` to `false` on the specified message and saves to `localStorage`. Called when the stream completes or errors.

#### `addPapers(sessionId: string, incoming: Paper[]): void`

Deduplicates and appends papers to the session-level paper list. Deduplication is by both `id` and normalized `title`.

---

### `StreamingService`

**File:** `src/app/core/services/streaming.service.ts`

Handles SSE streaming via `fetch()` + `ReadableStream`. Returns an RxJS `Observable<SSEEvent>` that emits parsed SSE events.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `isStreaming` | `Signal<boolean>` | Whether a stream is currently active |

**Public Methods:**

#### `streamChat(conversationId, query, forceTool?, sources?): Observable<SSEEvent>`

Initiates a streaming POST request to `/api/conversations/:id/messages/stream`.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | Yes | The conversation UUID |
| `query` | `string` | Yes | The user's query text |
| `forceTool` | `{ name: string; args: Record<string, unknown> }` | No | Force a specific MCP tool call (used for citation/reference lookups) |
| `sources` | `string[]` | No | Paper sources to search (`arxiv`, `openalex`), from `SearchScopeService`. Omitted means every source |

Optional parameters are omitted from the request body entirely when absent, rather than sent as `null`.

**Returns:** `Observable<SSEEvent>` -- emits events of type `token`, `papers`, `done`, or `error`. The Observable completes on `done` and errors on `error`. Unsubscribing aborts the fetch request.

**Implementation notes:**
- Uses `fetch()` instead of `EventSource` because SSE requires a POST body
- Buffers partial lines from the `ReadableStream` decoder
- Parses `data: {...}\n\n` SSE lines, ignoring malformed payloads
- Handles `data: [DONE]` as a completion sentinel

---

### `ApiService`

**File:** `src/app/core/services/api.service.ts`

HTTP client wrapper for conversation CRUD operations via Angular `HttpClient`.

**Public Methods:**

#### `getConversations(): Observable<ApiConversation[]>`

Fetches all conversations with their messages from the backend.

#### `createConversation(id: string, title: string): Observable<ApiConversation>`

Creates a conversation with a client-supplied UUID.

#### `getConversation(id: string): Observable<ApiConversation>`

Fetches a single conversation by ID.

#### `deleteConversation(id: string): Observable<void>`

Deletes a conversation by ID. Returns 204 on success.

---

### `ThemeService`

**File:** `src/app/core/services/theme.service.ts`

Manages dark/light theme state with `localStorage` persistence. Defaults to the user's OS preference or dark theme.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `theme` | `Signal<'dark-theme' \| 'light-theme'>` | Current theme (read-only) |

**Public Methods:**

#### `toggle(): void`

Switches between dark and light themes. Updates the `<body>` class and persists the choice to `localStorage` under the key `mcp_theme`.

#### `isDark(): boolean`

Returns `true` if the current theme is `dark-theme`.

---

### `NotesService`

**File:** `src/app/core/services/notes.service.ts`

HTTP client for notes endpoints.

**Public Methods:**

#### `getNotes(paperId?, tags?, limit?): Observable<Note[]>`

Lists notes with optional filters.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `paperId` | `string` | No | Filter by associated paper ID |
| `tags` | `string` | No | Comma-separated tag filter |
| `limit` | `number` | No | Maximum number of results |

#### `searchNotes(q: string, limit?: number): Observable<Note[]>`

Performs semantic vector search over notes.

#### `createNote(input: CreateNoteInput): Observable<Note>`

Creates a note via `POST /api/notes`. Backs the "Save note" action on an assistant answer.

```typescript
interface CreateNoteInput {
  title: string;
  content: string;
  paper_id?: string | null;  // Comma-separated paper IDs the note refers to
  tags?: string[];
}
```

#### `deleteNote(id: string): Observable<void>`

Deletes a note by ID.

---

### `SettingsService`

**File:** `src/app/core/services/settings.service.ts`

Holds the LLM provider settings and talks to `/api/settings`. Loaded once at startup so the composer's model chip renders everywhere without each page re-fetching. A failed load leaves `settings()` null and the chip on its defaults -- the app still works, because the backend resolves the provider server-side for every chat.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `settings` | `Signal<SettingsView \| null>` | Latest settings, or null before the first load lands |
| `loading` | `Signal<boolean>` | True while a load is in flight |
| `currentProvider` | `Signal<ProviderId>` | Active provider (computed), defaulting to `'ollama'` |
| `currentModelLabel` | `Signal<string>` | Model name for the active provider, for the composer chip (computed) |

**Public Methods:**

#### `load(): void`

Refreshes the cached settings from `GET /api/settings`. Errors are swallowed.

#### `save(input: UpdateSettingsInput): Observable<SettingsView>`

Sends a partial update to `PUT /api/settings` and adopts the returned view.

#### `listModels(input: ProviderProbeInput): Observable<ModelsResult>`

`POST /api/settings/models`. Never errors on a bad probe -- the response is HTTP 200 with an `error` field.

#### `test(input: ProviderProbeInput): Observable<ProbeResult>`

`POST /api/settings/test`. Round-trips one tiny completion; HTTP 200 either way.

The module also exports `pruneProbe()`, which strips blank fields from a probe input so the backend falls back to the stored values rather than receiving empty strings.

---

### `SearchScopeService`

**File:** `src/app/core/services/search-scope.service.ts`

Holds the set of paper sources the composer searches, persisted to `localStorage` under the key `mcp_search_sources`.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `sources` | `Signal<SearchSource[]>` | Enabled sources, in canonical order and never empty |

**Public Methods:**

#### `isEnabled(s: SearchSource): boolean`

Whether a source (`'arxiv' \| 'openalex'`) is currently enabled.

#### `toggle(s: SearchSource): void`

Enables or disables a source. Toggling off the last remaining source is a no-op -- at least one source is always enabled.

---

### `CitationFocusService`

**File:** `src/app/core/services/citation-focus.service.ts`

Bridges a `[n]` citation chip click in the answer thread to the sources rail.

**Signals:**

| Signal | Type | Description |
|--------|------|-------------|
| `focusedPaperId` | `Signal<string \| null>` | Id of the source last requested by id. Takes precedence |
| `focusedIndex` | `Signal<number \| null>` | 1-based position of the source last requested positionally |
| `tick` | `Signal<number>` | Increments on every focus call, so clicking the same chip twice re-triggers the rail |

**Public Methods:**

#### `focusPaper(id: string): void`

Reveals the source with this id, wherever the rail lists it. This is the accurate path: the model numbers its `[n]` markers against its own source list for that turn, so only the clicking message can say which paper a number means.

#### `focus(index: number): void`

Reveals the nth source of the session. The fallback for older threads whose messages carry no per-message source list.

---

## Data Models

### `Paper`

**File:** `src/app/core/models/chat.models.ts`

```typescript
interface Paper {
  id: string;           // arXiv ID or DOI
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  url?: string;         // Link to paper page
  doi?: string;
  venue?: string;
  citationCount?: number;
  source?: string;      // "arxiv" | "openalex"
}
```

### `Message`

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  papers?: Paper[];     // Papers attached to this message
  timestamp: Date;
  isStreaming?: boolean; // True while tokens are still arriving
}
```

### `ChatSession`

```typescript
interface ChatSession {
  id: string;           // Client-generated UUID
  title: string;        // First user query
  messages: Message[];
  papers: Paper[];      // Session-level accumulated papers
  createdAt: Date;
  updatedAt: Date;
}
```

### `SSEEvent`

```typescript
interface SSEEvent {
  type: 'token' | 'papers' | 'done' | 'error';
  data: string | Paper[] | null;
}
```

### `Note`

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  paper_id: string | null;  // Associated paper IDs (comma-separated)
  tags: string[];
  created_at: string;       // ISO timestamp
  updated_at: string;
  score?: number;            // Vector search distance (lower = more similar)
}
```

### API Types (`src/app/types/api.types.ts`)

Raw backend JSON response shapes before hydration:

```typescript
interface ApiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  papers: string | null;     // JSON-serialized Paper[]
  createdAt: string;         // ISO string
}

interface ApiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ApiMessage[];
}
```

The `SessionService.hydrateSession()` method maps `ApiConversation` to `ChatSession`, converting `createdAt` strings to `Date` objects and parsing the `papers` JSON string.

### Settings Types (`src/app/types/settings.types.ts`)

Shapes of the LLM-provider settings JSON exchanged with the backend under `/api/settings`:

| Type | Used For |
|------|----------|
| `ProviderId` | `'ollama' \| 'anthropic'` |
| `SettingsView` | What `GET`/`PUT /api/settings` return |
| `UpdateSettingsInput` | Body of `PUT /api/settings` |
| `ProviderProbeInput` | Body of `POST /api/settings/models` and `/test` |
| `ModelOption`, `ModelsResult` | Model-list responses |
| `ProbeResult` | Connection-test responses |

The Anthropic API key is **write-only**: it goes up in `UpdateSettingsInput` and `ProviderProbeInput`, but never comes back down. `SettingsView` carries only `anthropicApiKeySet` and a masked `anthropicApiKeyHint` (`••••1234`), plus `anthropicEnvKeyPresent` when the orchestrator has its own fallback key.

Both probe results are always HTTP 200; a failed probe is an `error` string on the body, never a thrown `HttpErrorResponse`.

---

## Page Components

### HomeComponent

**File:** `src/app/pages/home/home.component.ts`

Landing page: a hero headline and subtitle above the composer, with suggested research topics below it. When the user submits a query (either typed or from a suggested topic), it creates a new session via `SessionService.createSession()` and navigates to `/research/:sessionId`.

**Child components:**
- `QueryInputComponent` (hero size variant) -- The composer, with its scope chips and model chip
- `SuggestedTopicsComponent` -- Grid of clickable topic chips (e.g., "Large language models", "Quantum computing", "CRISPR gene editing", "Climate change models", "Neuroplasticity", "Protein folding")

### ResearchComponent

**File:** `src/app/pages/research/research.component.ts`

Two-column layout for active research. Left column shows the conversation thread, right column is the 380px sources rail.

**Inputs:**
| Name | Type | Source |
|------|------|--------|
| `sessionId` | `string` | Route parameter `:sessionId` |

**Child components:**
- `AnswerPanelComponent` -- Message thread and follow-up input
- `SourcesPanelComponent` -- Paper cards list with citation/reference lookup

**Behavior:**
- Navigates back to `/` if the session is deleted while viewing
- Handles `CitationLookup` events from `SourcesPanelComponent` by calling `AnswerPanelComponent.submitWithForcedTool()` to trigger `get_citations` or `get_references` tool calls

### AnswerPanelComponent

**File:** `src/app/pages/research/answer-panel/answer-panel.component.ts`

Core chat component that manages the SSE streaming lifecycle.

**Inputs:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | `string` | Yes | Active session ID |

**Lifecycle:**
1. On init, sets the active session and checks if the last message is a user message without a reply
2. If so, starts streaming by creating a placeholder assistant message and subscribing to `StreamingService.streamChat()`
3. Token events append to the assistant message; paper events are added to the session
4. On stream completion/error, the message is finalized

**Public Methods:**

##### `onFollowUp(query: string): void`

Handles follow-up queries from the inline `QueryInputComponent`.

##### `submitWithForcedTool(displayMessage, forceTool): void`

Submits a query with a forced MCP tool call. Used for citation/reference lookups from `PaperCardComponent`.

**Child components:**
- `MessageThreadComponent` -- Scrollable container for `MessageBubbleComponent` instances with auto-scroll during streaming
- `MessageBubbleComponent` -- Renders user messages as plain text, assistant messages as markdown with a **Copy** / **Save note** / **Rewrite** action row. Takes `maxCitations` (how many sources this answer cited) and `disableRewrite`; emits `saveNote` and `rewrite`
  - `MarkdownViewerComponent` -- Wraps `ngx-markdown` `<markdown>` for rendering, then rewrites `[n]` citation markers into clickable chips. Emits `citeClick` with the 1-based number
  - `StreamingCursorComponent` -- Animated blinking cursor displayed during streaming
- `QueryInputComponent` -- Follow-up query input (inline size variant)

#### Citation chips

**File:** `src/app/pages/research/answer-panel/markdown-viewer/citation-transform.ts`

`wrapCitations(html, max)` is a pure string transform (unit-testable without a DOM) that turns `[n]` markers in the rendered markdown into `<a class="citation-chip" data-cite="n">` anchors. It splits the HTML on tags and rewrites only text segments outside `<code>`, `<pre>`, and `<a>` elements. Markers are left verbatim when they reference a source that does not exist (`n > max`, `n < 1`) or when there are no sources. Supported forms: `[1]`, `[1, 3]` (one chip per number), and `[1][2]`.

Clicking a chip goes through `CitationFocusService`, which reveals the matching paper in the sources rail. The mapping is **per message** -- the model numbers its markers against its own source list for that turn, so `maxCitations` and the id lookup are scoped to the message that was clicked.

### SourcesPanelComponent

**File:** `src/app/pages/research/sources-panel/sources-panel.component.ts`

The 380px sources rail. Displays accumulated papers for the current session with a skeleton loading state; one card can be expanded at a time (`expandedId`), and a citation chip click scrolls to and highlights the matching card.

**Inputs/Outputs:**
| Name | Type | Direction | Description |
|------|------|-----------|-------------|
| `sessionId` | `string` | Input | Active session ID |
| `citationLookup` | `EventEmitter<CitationLookup>` | Output | Emitted when user clicks citation/reference buttons |

### HistoryComponent

**File:** `src/app/pages/history/history.component.ts`

Searchable list of all past research sessions. Provides local text filtering via a signal-based search query.

**Features:**
- Search input filters sessions by title and message content
- Each row shows title, snippet from first assistant message, date, paper count
- Delete button on each row
- "New thread" link in the page header navigates to home

Sessions render as inline rows styled by the page itself; there is no separate session-card component.

### NotesComponent

**File:** `src/app/pages/notes/notes.component.ts`

Notes management page with debounced search (400ms). Uses `toObservable()` on the search signal piped through `debounceTime` and `switchMap` to either `getNotes()` or `searchNotes()`.

**Child components:**
- `NoteCardComponent` -- Expandable card showing note title, content (with show more/less for 200+ characters), tags as chips, paper IDs with DOI copy, semantic similarity score badge (when from search), relative date formatting, and delete button

### SettingsComponent

**File:** `src/app/pages/settings/settings.component.ts`

The LLM provider settings page. Under a "Model provider" section it offers a choice of Ollama or Anthropic, the model for each, the Ollama base URL, and the Anthropic API key -- plus a **Test connection** button and a **Save** button.

Form state lives in local signals (`provider`, `ollamaBaseUrl`, `ollamaModel`, `anthropicModel`, `anthropicApiKey`, `clearKey`) hydrated from `SettingsService`; nothing is persisted until Save. Model lists are fetched per provider through `SettingsService.listModels()` and rendered as a select once they arrive, falling back to a free-text field while they are loading or unavailable (`ollamaSelectMode` / `anthropicSelectMode`).

The API key field is write-only. The page shows the `••••1234` hint from `SettingsView` when a key is stored, offers an explicit "clear" toggle that sends `anthropicApiKey: ''`, and notes when the orchestrator has its own environment key (`anthropicEnvKeyPresent`).

---

## Layout Components

### AppComponent

**File:** `src/app/app.component.ts`

Root application shell using `MatSidenav`. Manages:
- Responsive layout: `MatSidenav` mode switches between `'side'` (desktop) and `'over'` (mobile) based on `BreakpointObserver`
- Sidebar collapsed state: persisted to `localStorage` under key `sidebar_collapsed`
- Only renders `TopBarComponent` on mobile (handset) breakpoint

### SidebarComponent

**File:** `src/app/layout/sidebar/sidebar.component.ts`

240px navigation sidebar: a header with the logo, four nav links (**New thread** with its ⌘K hint, **History**, **Notes**, **Settings**), the session list, and a footer. Accepts `collapsed` input and emits `toggleCollapse` and `closeSidenav` events. When collapsed, labels give way to tooltips and the session list is hidden entirely.

### SessionListComponent

**File:** `src/app/layout/sidebar/session-list/session-list.component.ts`

Sits under a "Library" label and groups sessions into time-based categories using a computed signal:
- Today
- Yesterday
- This Week
- Older

### SidebarFooterComponent

**File:** `src/app/layout/sidebar/sidebar-footer/sidebar-footer.component.ts`

Pinned to the bottom of the sidebar. Holds the theme toggle (labelled "Dark"/"Light") and the collapse toggle, which emits `toggleCollapse`. Accepts the same `collapsed` input, and swaps labels for tooltips when collapsed.

### TopBarComponent

**File:** `src/app/layout/top-bar/top-bar.component.ts`

Mobile-only toolbar with hamburger menu button and theme toggle. Only rendered when `isHandset()` is true.

---

## Shared Components

### QueryInputComponent

**File:** `src/app/shared/components/query-input/query-input.component.ts`

The composer: an auto-resizing textarea (via `cdkTextareaAutosize`) with global keyboard shortcut support, in a rounded surface with a control row beneath it.

**Inputs:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'hero' \| 'inline'` | `'hero'` | Visual size variant |
| `placeholder` | `string` | Auto-set by size | Placeholder text |
| `disabled` | `boolean` | `false` | Disables input during streaming |

**Outputs:**
| Name | Type | Description |
|------|------|-------------|
| `querySubmit` | `EventEmitter<string>` | Emitted on Enter (without Shift) or send button click |

**Controls:**

- **Scope chips** (hero variant) -- `arXiv` and `OpenAlex` toggles backed by `SearchScopeService`. They set which sources the query searches; the last enabled one cannot be turned off
- **Model chip** -- Shows `SettingsService.currentModelLabel()` with a provider icon, and links to `/settings`. Present in both size variants
- **⌘K hint and send button** (hero variant)

**Keyboard shortcuts:**
- `Cmd+K` / `Ctrl+K` -- Focus the textarea (global listener)
- `Enter` -- Submit query
- `Shift+Enter` -- New line

### PaperCardComponent

**File:** `src/app/shared/components/paper-card/paper-card.component.ts`

Displays a paper's metadata (title, authors, year, venue, abstract, citation count) with action buttons.

**Inputs:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `paper` | `Paper` | Yes | The paper to display |
| `index` | `number` | No | Optional 0-based index (displayed as 1-based) |

**Outputs:**
| Name | Type | Description |
|------|------|-------------|
| `citationLookup` | `EventEmitter<CitationLookup>` | Emitted when citing/referenced papers buttons are clicked |

**Actions:**
- Copy citation (APA-style format built from paper metadata)
- Open paper URL in new tab
- Find citing papers (OpenAlex papers only, checks `paper.source === 'openalex'`)
- Find references (OpenAlex papers only)

**Exported interface:**
```typescript
interface CitationLookup {
  type: 'citations' | 'references';
  paperId: string;
  paperTitle: string;
}
```

---

## Path Aliases

Defined in `tsconfig.json`:

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@core/*` | `src/app/core/*` | Services, models |
| `@shared/*` | `src/app/shared/*` | Shared components |
| `@layout/*` | `src/app/layout/*` | Layout components |
| `@pages/*` | `src/app/pages/*` | Page components |
| `@api-types/*` | `src/app/types/*` | Backend API response shapes |

---

## Theming and Styling

**File:** `src/styles.scss`

The application uses Angular Material theming with CSS custom properties for flexible dark/light theme support.

### Theme System

- **Dark theme** is the default, applied globally via `mat.all-component-themes($dark-theme)`
- **Light theme** ("Paper") overrides colors when the `light-theme` class is present on `<body>` via `mat.all-component-colors($light-theme)`
- `ThemeService` toggles the body class and persists the choice
- The Material palettes only surface in the tooltip, snackbar, and spinner. Everything else is driven by the CSS custom properties below, so those tokens are where the look actually lives

### CSS Custom Properties

All custom colors and layout values are defined as CSS variables in `:root`, with the light theme redefining the colors under `.light-theme`. The dark theme is a near-black console; the light theme ("Paper") is a warm off-white.

| Variable | Dark Value | Light Value | Description |
|----------|-----------|-------------|-------------|
| `--app-bg` | `#191A1A` | `#FBFAF4` | Page background |
| `--app-surface` | `#202222` | `#FFFFFF` | Composer, cards |
| `--app-rail` | `#1D1F1F` | `#F4F3EC` | Sidebar and sources rail |
| `--app-surface-elevated` | `#262929` | `#F4F3EC` | User bubble, hover |
| `--app-text-primary` | `#E9E9E4` | `#13343B` | Primary text |
| `--app-text-body` | `#C9CEC9` | `#2E4547` | Long-form answer text |
| `--app-text-secondary` | `#8D9797` | `#5F6E6F` | Secondary text |
| `--app-text-faint` | `#6E7878` | `#8A9697` | Placeholders, mono labels |
| `--app-border` | `rgba(255,255,255,0.08)` | `rgba(19,52,59,0.12)` | Border color |
| `--accent-color` | `#23B5CB` | `#20808D` | Accent/highlight |
| `--on-accent` | `#191A1A` | `#FBFAF4` | Text on an accent fill |

Layout tokens are theme-independent:

| Variable | Value | Description |
|----------|-------|-------------|
| `--sidebar-width` | `240px` | Expanded sidebar |
| `--sidebar-collapsed-width` | `56px` | Collapsed sidebar |
| `--sources-rail-width` | `380px` | Sources rail |
| `--content-max-width` | `720px` | Answer column |
| `--composer-width` | `760px` | Composer |

Radii (`--radius-sm` through `--radius-pill`, plus `--radius-nav`, `--radius-composer`, `--radius-followup`) and shadows (`--composer-shadow`, `--floating-shadow`) round out the token set.

### Typography

Three families, loaded from Google Fonts in `index.html` and exposed as tokens:

| Token | Family | Used For |
|-------|--------|----------|
| `--font-sans` | Hanken Grotesk | UI and body text (also the Material typography config) |
| `--font-display` | Source Serif 4 | Page titles and the home hero headline |
| `--font-mono` | Space Mono | Section labels, keyboard hints, the model chip, code |

Code blocks use `highlight.js` with the `github-dark` theme. The browser-tab icon is `src/favicon.svg`.

### Markdown Rendering

Markdown content is rendered via `ngx-markdown` (v17) using the `MarkdownViewerComponent`. The `.markdown-content` class in `styles.scss` provides comprehensive styling for all markdown elements including headings, code blocks, blockquotes, tables, horizontal rules, and images.

---

## Key Architectural Decisions

### Angular Signals for State, RxJS for Streams

- **Signals** (`signal()`, `computed()`) are used for synchronous reactive state in services (`SessionService`, `ThemeService`, `StreamingService.isStreaming`)
- **RxJS Observables** are used for asynchronous event streams (SSE streaming, HTTP calls, debounced search)
- This hybrid approach leverages Signals for efficient change detection while using RxJS where its operators (like `debounceTime`, `switchMap`) are essential

### SSE via `fetch()` + `ReadableStream`, Not `EventSource`

The browser `EventSource` API only supports GET requests. Since the chat endpoint requires a POST body (with `query` and optional `forceTool` / `sources`), the `StreamingService` uses `fetch()` with `ReadableStream` to consume the SSE stream. The response is manually parsed line-by-line.

### The Provider Is Resolved Server-Side

`SettingsComponent` writes the provider choice to the backend, and `SettingsService` caches it purely so the composer's model chip has something to display. The chat request itself never carries provider information: the backend reads the stored settings and attaches the `llm` block when it proxies to the orchestrator. A failed settings load therefore degrades the chip, not the chat -- and the API key never reaches the browser at all.

### Client-Generated UUIDs

The frontend generates conversation UUIDs via `crypto.randomUUID()` before sending them to the backend. This eliminates the need for an optimistic-to-real ID swap pattern -- the ID used in the URL and in-memory state is immediately the permanent ID.

### LocalStorage as Cache, Backend as Authority

Sessions are cached in `localStorage` for instant display on page load, but the backend (Prisma/SQLite) is the authoritative source. On startup, `SessionService` fetches all conversations from the backend and replaces the cached data.

---

## Development Setup

### Prerequisites

- Node.js 18+
- Angular CLI 17+ (`npm install -g @angular/cli`)

### Installation

```bash
cd frontend
npm install
```

### Running the Dev Server

```bash
npm start
# or
ng serve
```

The application is available at [http://localhost:4200](http://localhost:4200).

### Proxy Configuration

During development, the Angular dev server proxies all `/api/*` requests to the NestJS backend at `http://localhost:3000`. This is configured in `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug"
  }
}
```

The proxy configuration is referenced in `angular.json` under `architect.serve.options.proxyConfig`.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `ng serve` | Start development server on port 4200 with proxy |
| `build` | `ng build` | Production build to `dist/frontend/` |
| `watch` | `ng build --watch --configuration development` | Rebuild on file changes |
| `test` | `ng test` | Run unit tests with Karma/Jasmine |

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | ^17.3.0 | Angular framework |
| `@angular/material` | ^17.3.10 | UI component library |
| `@angular/cdk` | ^17.3.10 | Component Dev Kit (text-field, breakpoints) |
| `ngx-markdown` | ^17.2.1 | Markdown rendering |
| `marked` | ^12.0.2 | Markdown parser (peer dependency) |
| `highlight.js` | ^11.11.1 | Syntax highlighting in code blocks |
| `rxjs` | ~7.8.0 | Reactive programming |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/cli` | ^17.3.4 | Angular CLI tooling |
| `typescript` | ~5.4.2 | TypeScript compiler |
| `karma` | ~6.4.0 | Test runner |
| `jasmine-core` | ~5.1.0 | Test framework |
