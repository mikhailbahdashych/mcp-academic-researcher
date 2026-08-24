# Backend -- NestJS API Gateway

The backend is a NestJS 10 API gateway that serves as the persistence layer and SSE streaming proxy between the Angular frontend and the Python orchestrator. It manages conversations, messages, and LLM provider settings in SQLite via Prisma, validates requests, and forwards chat queries to the orchestrator -- together with the provider config to answer them with -- while streaming responses back to the client.

[Back to project root](../README.md)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Module Structure](#module-structure)
- [API Endpoints Reference](#api-endpoints-reference)
- [Prisma Schema](#prisma-schema)
- [DTOs](#dtos)
- [SSE Streaming Contract](#sse-streaming-contract)
- [Mock Stream Fallback](#mock-stream-fallback)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Available Scripts](#available-scripts)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  NestJS Application (port 3000, prefix /api)                         │
│                                                                      │
│  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ │
│  │ Conversations│ │  Chat       │ │  Notes      │ │  Settings      │ │
│  │ Module       │ │  Module     │ │  Module     │ │  Module        │ │
│  │              │ │             │ │             │ │                │ │
│  │ Controller   │ │ Controller  │ │ Controller  │ │ Controller     │ │
│  │ Service      │ │ Service     │ │ Service     │ │ Service        │ │
│  │ DTO          │ │ DTO         │ │ DTO         │ │ DTOs           │ │
│  └───────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────────┬───────┘ │
│          │               │               │                 │         │
│          └───────────────┴───────┬───────┴─────────────────┘         │
│                                  │                                   │
│  ┌───────────────────────────────▼─────────────────────────────────┐ │
│  │                 PrismaModule (Global)                           │ │
│  │                 PrismaService                                   │ │
│  │                 SQLite via Prisma 6                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 ConfigModule (Global)                           │ │
│  │                 .env file loading                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP (axios) -- Chat, Notes, Settings
                           ▼
              ┌──────────────────────┐
              │ Python Orchestrator  │
              │ (port 8000)          │
              └──────────────────────┘
```

`NotesModule` is a pure proxy and holds no Prisma state of its own; the other three read and write the SQLite database.

---

## Module Structure

### AppModule

**File:** `src/app.module.ts`

Root module that imports all feature modules:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ConversationsModule,
    ChatModule,
    NotesModule,
    SettingsModule,
  ],
})
export class AppModule {}
```

### PrismaModule / PrismaService

**Files:** `src/common/database/prisma.module.ts`, `src/common/database/prisma.service.ts`

Global module providing the `PrismaService` singleton. The service extends `PrismaClient` and implements `OnModuleInit` (connects on startup) and `OnModuleDestroy` (disconnects on shutdown).

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### ConversationsModule

**Files:** `src/modules/conversations/`

CRUD operations for conversations and their messages.

**Controller:** `ConversationsController` -- prefix `conversations`

**Service:** `ConversationsService` -- injectable, uses `PrismaService`

The module exports `ConversationsService` so that `ChatModule` can look up conversations before streaming.

### ChatModule

**Files:** `src/modules/chat/`

SSE streaming endpoint that proxies chat requests to the Python orchestrator.

**Controller:** `ChatController` -- reuses the `conversations` prefix

**Service:** `ChatService` -- handles the streaming proxy logic, saves messages to the database

**Imports:** `ConversationsModule` (to use `ConversationsService.findOne()`), `SettingsModule` (to use `SettingsService.getLlmConfig()`)

Every request to the orchestrator carries an `llm` block resolved from the stored settings, plus the paper `sources` the client asked for. See [SSE Streaming Contract](#sse-streaming-contract).

### NotesModule

**Files:** `src/modules/notes/`

Proxy endpoints for notes operations. The actual notes storage is in the Python orchestrator's SQLite database (via `notes_router.py`).

**Controller:** `NotesController` -- prefix `notes`

**Service:** `NotesService` -- forwards requests to the orchestrator via axios. Creating a note translates the orchestrator's 503 (embedding service down) into a `ServiceUnavailableException`, and a delete of a missing note into a `NotFoundException`.

### SettingsModule

**Files:** `src/modules/settings/`

Stores which LLM provider answers chats, and probes providers on the settings page's behalf.

**Controller:** `SettingsController` -- prefix `settings`

**Service:** `SettingsService` -- reads/writes the singleton `Setting` row, and proxies provider probes to the orchestrator's `/llm/*` endpoints

**Exports:** `SettingsService`, so `ChatModule` can call `getLlmConfig()` before each stream

Two rules shape the whole module:

- **The API key never comes back down.** `GET`/`PUT` return `anthropicApiKeySet` plus a masked `••••1234` hint, never the key. Logs record the provider name only, never the payload.
- **A broken provider is a result, not a failure.** `POST /api/settings/models` and `POST /api/settings/test` always resolve with HTTP 200; an unconfigured, unreachable, or rejecting provider comes back in the `error` field.

---

## API Endpoints Reference

All endpoints are prefixed with `/api` (set via `app.setGlobalPrefix('api')` in `main.ts`).

### Conversations

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/conversations` | List all conversations | -- | `Conversation[]` (with messages, ordered by `updatedAt` desc) |
| `POST` | `/api/conversations` | Create a conversation | `CreateConversationDto` | `Conversation` (with empty messages array) |
| `GET` | `/api/conversations/:id` | Get a conversation by ID | -- | `Conversation` (with messages ordered by `createdAt` asc) |
| `DELETE` | `/api/conversations/:id` | Delete a conversation | -- | 204 No Content |

### Chat (SSE Streaming)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/conversations/:id/messages/stream` | Stream a chat response | `StreamChatDto` (`{ query, forceTool?, sources? }`) | SSE event stream (`text/event-stream`) |

### Notes

| Method | Path | Description | Query Params / Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/notes` | List notes | `paper_id?`, `tags?`, `limit?` | `Note[]` |
| `GET` | `/api/notes/search` | Semantic search notes | `q` (required), `limit?` | `Note[]` (with `score` field) |
| `POST` | `/api/notes` | Create a note | `CreateNoteDto` | The created `Note` |
| `DELETE` | `/api/notes/:id` | Delete a note | -- | 204 No Content |

`POST /api/notes` is proxied to the orchestrator's `POST /notes`, which embeds the note before storing it. A 503 from the orchestrator (embedding service unavailable) is re-raised as a 503 with the message `Note embedding service unavailable`.

### Settings

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/settings` | Read the current provider settings | -- | `SettingsView` |
| `PUT` | `/api/settings` | Partially update the settings | `UpdateSettingsDto` | `SettingsView` (updated) |
| `POST` | `/api/settings/models` | List the models a provider offers | `ProviderProbeDto` | `{ models: { id, name }[], error?: string }` -- always 200 |
| `POST` | `/api/settings/test` | Round-trip one completion through a provider | `ProviderProbeDto` | `{ ok, model?, latencyMs?, reply?, error? }` -- always 200 |

Both probe endpoints are declared `@HttpCode(200)`: they inspect a provider, they do not create anything.

**`SettingsView`** -- what `GET` and `PUT` return. The stored Anthropic key is never included:

```typescript
interface SettingsView {
  llmProvider: 'ollama' | 'anthropic';
  ollamaBaseUrl: string;      // e.g. "http://localhost:11434"
  ollamaModel: string;        // e.g. "qwen2.5:7b"
  anthropicModel: string;     // e.g. "claude-opus-5"
  anthropicApiKeySet: boolean;        // a key is stored
  anthropicApiKeyHint: string | null; // "••••1234", null for keys of 4 chars or fewer
  anthropicEnvKeyPresent: boolean;    // the orchestrator has its own env key
  updatedAt: string;                  // ISO 8601
}
```

`anthropicEnvKeyPresent` comes from the orchestrator's `GET /llm/env`. It is advisory, so an unreachable orchestrator answers `false` rather than failing the read.

---

## Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Conversation {
  id        String    @id @default(uuid())
  title     String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt      @map("updated_at")
  messages  Message[]

  @@map("conversations")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  role           String
  content        String
  papers         String?
  createdAt      DateTime     @default(now()) @map("created_at")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("messages")
}

model Setting {
  id              String   @id @default("default")
  llmProvider     String   @default("ollama")                  @map("llm_provider")
  ollamaBaseUrl   String   @default("http://localhost:11434")   @map("ollama_base_url")
  ollamaModel     String   @default("qwen2.5:7b")               @map("ollama_model")
  anthropicModel  String   @default("claude-opus-5")            @map("anthropic_model")
  anthropicApiKey String?                                       @map("anthropic_api_key")
  updatedAt       DateTime @updatedAt                           @map("updated_at")

  @@map("settings")
}
```

### Field Descriptions

**Conversation:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | UUID primary key. Can be client-supplied via `CreateConversationDto.id` |
| `title` | `String` | Conversation title (typically the first user query) |
| `createdAt` | `DateTime` | Auto-set on creation |
| `updatedAt` | `DateTime` | Auto-updated by Prisma's `@updatedAt`; also manually set after streaming |
| `messages` | `Message[]` | One-to-many relation to messages |

**Message:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | Auto-generated UUID |
| `conversationId` | `String` | Foreign key to `Conversation.id` |
| `role` | `String` | `"user"` or `"assistant"` |
| `content` | `String` | Message text content. For assistant messages, accumulated from SSE tokens |
| `papers` | `String?` | JSON-serialized array of `Paper` objects (null for user messages) |
| `createdAt` | `DateTime` | Auto-set on creation |

Messages cascade-delete when their parent conversation is deleted.

**Setting:**

`Setting` is a **single-row** model: the id defaults to the literal string `"default"`, and `SettingsService` reads it with an `upsert`, so the row is created with schema defaults the first time anything asks for it.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | Always `"default"` -- the singleton row key |
| `llmProvider` | `String` | `"ollama"` or `"anthropic"`; which provider answers chats |
| `ollamaBaseUrl` | `String` | Ollama host, default `http://localhost:11434` |
| `ollamaModel` | `String` | Ollama model tag, default `qwen2.5:7b` |
| `anthropicModel` | `String` | Claude model id, default `claude-opus-5` |
| `anthropicApiKey` | `String?` | Stored Anthropic key. Never returned by the API -- only `anthropicApiKeySet` and a `••••1234` hint are |
| `updatedAt` | `DateTime` | Auto-updated by Prisma's `@updatedAt` |

### Migrations

| Migration | Contents |
|-----------|----------|
| `20260306061551_init` | `conversations` and `messages` tables |
| `20260823171643_add_settings` | `settings` table (the `Setting` model above) |

---

## DTOs

### CreateConversationDto

**File:** `src/modules/conversations/dto/create-conversation.dto.ts`

```typescript
class CreateConversationDto {
  @IsOptional()
  @IsUUID()
  id?: string;        // Client-generated UUID (optional)

  @IsString()
  @IsNotEmpty()
  title: string;      // Conversation title
}
```

### StreamChatDto

**File:** `src/modules/chat/dto/stream-chat.dto.ts`

```typescript
class StreamChatDto {
  @IsString()
  @IsNotEmpty()
  query: string;      // The user's chat message

  @IsOptional()
  @IsObject()
  forceTool?: {       // Force a specific MCP tool call
    name: string;
    args: Record<string, unknown>;
  };

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['arxiv', 'openalex'], { each: true })
  sources?: string[]; // Paper sources to search; omitted means all of them
}
```

### CreateNoteDto

**File:** `src/modules/notes/dto/create-note.dto.ts`

```typescript
class CreateNoteDto {
  @IsString() @IsNotEmpty()
  title!: string;              // Note title (the card heading)

  @IsString() @IsNotEmpty()
  content!: string;            // Full note body text

  @IsOptional() @IsString()
  paper_id?: string | null;    // Comma-separated paper IDs the note refers to

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];             // Tag strings for categorization
}
```

Snake-case `paper_id` is deliberate: the body is forwarded to the orchestrator's `POST /notes` unchanged.

### UpdateSettingsDto

**File:** `src/modules/settings/dto/update-settings.dto.ts`

```typescript
class UpdateSettingsDto {
  @IsOptional() @IsIn(['ollama', 'anthropic'])
  llmProvider?: 'ollama' | 'anthropic';

  @IsOptional() @IsUrl({ require_tld: false, require_protocol: true })
  ollamaBaseUrl?: string;

  @IsOptional() @IsString() @MaxLength(200)
  ollamaModel?: string;

  @IsOptional() @IsString() @MaxLength(200)
  anthropicModel?: string;

  @IsOptional() @IsString() @MaxLength(500)
  anthropicApiKey?: string;
}
```

Every field is optional and omission means "leave unchanged". A blank model or URL is ignored rather than stored, since an empty one would break every subsequent chat. `anthropicApiKey` is the exception: an empty string is how the UI **clears** the stored key.

### ProviderProbeDto

**File:** `src/modules/settings/dto/provider-probe.dto.ts`

```typescript
class ProviderProbeDto {
  @IsIn(['ollama', 'anthropic'])
  provider: 'ollama' | 'anthropic';   // The only required field

  @IsOptional() @IsUrl({ require_tld: false, require_protocol: true })
  baseUrl?: string;                   // Ollama host to probe

  @IsOptional() @IsString() @MaxLength(500)
  apiKey?: string;                    // Unsaved key typed into the settings page

  @IsOptional() @IsString() @MaxLength(200)
  model?: string;                     // Model to test against
}
```

Credentials are probed **before** they are saved, so the page can validate a key the user has only typed. Omitted or blank fields fall back to what is stored (and, for the Anthropic key, ultimately to the orchestrator's own environment).

---

## SSE Streaming Contract

The `POST /api/conversations/:id/messages/stream` endpoint returns a `text/event-stream` response. Each line follows the SSE format:

```
data: {"type":"token","data":"text chunk"}\n\n
data: {"type":"papers","data":[{...paper objects...}]}\n\n
data: {"type":"done","data":null}\n\n
data: [DONE]\n\n
```

### Event Types

| Type | Data | Description |
|------|------|-------------|
| `token` | `string` | A text fragment from the LLM response |
| `papers` | `Paper[]` | Array of discovered paper objects (emitted once, before `done`) |
| `done` | `null` | Signals that the response is complete |
| `error` | `string` | Error message (if the stream fails) |

The `data: [DONE]` sentinel is emitted as the final line after the `done` event.

### Streaming Lifecycle (ChatService)

1. Look up the conversation (throws 404 if not found)
2. Resolve the provider config via `SettingsService.getLlmConfig()` -- before anything is persisted and before the stream is opened, so a settings-read failure surfaces as a normal error rather than a half-written SSE stream blaming the orchestrator
3. Save the user's message to the database
4. Create a placeholder assistant message (empty content)
5. Set SSE response headers (`Content-Type: text/event-stream`, etc.)
6. Build the message history from the conversation's existing messages
7. Forward the request to the Python orchestrator via axios with `responseType: 'stream'`
8. Pipe incoming chunks directly to the client response
9. Accumulate token content and papers for database persistence
10. On stream end: update the assistant message with accumulated content and papers
11. Update the conversation's `updatedAt` timestamp
12. End the response

### Orchestrator Request Payload

The body posted to the orchestrator's `POST /chat`:

```typescript
{
  conversation_id: string,
  message: string,                  // StreamChatDto.query
  history: { role, content }[],     // Prior messages of the conversation
  force_tool: { name, args } | null,
  sources: string[] | null,         // StreamChatDto.sources; null means every source
  llm: {                            // From SettingsService.getLlmConfig()
    provider: 'ollama' | 'anthropic',
    model: string,
    api_key: string | null,         // Anthropic only; null for Ollama
    base_url: string | null,        // Ollama only; null for Anthropic
  },
}
```

Sending `llm` per request is what keeps the orchestrator stateless: it holds no provider configuration of its own, beyond an environment key it can fall back to.

The axios call sets `timeout: 0` on purpose. Axios counts socket inactivity, and the orchestrator is legitimately silent until its first token -- classification, pre-search, and a cold local model can outlast any deadline, and a timeout would fabricate the "orchestrator is not running" mock answer below. A refused connection still rejects immediately and falls back.

---

## Mock Stream Fallback

When the Python orchestrator is unreachable (connection refused, timeout), the `ChatService` falls back to a mock stream response:

```
data: {"type":"token","data":"[Mock response] "}\n\n
data: {"type":"token","data":"The Python Orchestrator is not running yet. "}\n\n
data: {"type":"token","data":"You asked: \"<query>\". "}\n\n
data: {"type":"token","data":"Start the orchestrator at port 8000 to get real responses."}\n\n
data: {"type":"done","data":null}\n\n
data: [DONE]\n\n
```

Each token is sent with an 80ms delay to simulate streaming. The mock content is saved to the database as the assistant message.

---

## Environment Variables

**File:** `.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/app.db` | Prisma connection string for SQLite |
| `ORCHESTRATOR_URL` | `http://localhost:8000` | Python orchestrator base URL |
| `PORT` | `3000` | Server listening port |
| `CORS_ORIGIN` | `http://localhost:4200` | Allowed CORS origin |

There is deliberately **no LLM environment variable here.** The provider, model, and Anthropic key live in the `settings` table and are edited from the app's Settings page; the orchestrator's own `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` is only a fallback for when no key is stored (see the [Python README](../python/README.md#environment-variables)).

---

## Development Setup

### Prerequisites

- Node.js 18+
- NestJS CLI (`npm install -g @nestjs/cli`)

### Installation

```bash
cd backend
npm install
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Apply the existing migrations (creates data/app.db)
npx prisma migrate dev

# Only when changing schema.prisma: create a new migration
npx prisma migrate dev --name <name>
```

### Running

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server starts on [http://localhost:3000](http://localhost:3000) with the `/api` prefix.

### Bootstrap Configuration

**File:** `src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
```

- **CORS**: Configured via `CORS_ORIGIN` env var
- **Global prefix**: All routes are under `/api`
- **ValidationPipe**: `whitelist: true` strips unknown properties; `transform: true` enables DTO transformation

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `nest start` | Start in production mode |
| `start:dev` | `nest start --watch` | Start with file watching |
| `start:debug` | `nest start --debug --watch` | Start with debugger |
| `start:prod` | `node dist/main` | Run compiled output |
| `build` | `nest build` | Compile TypeScript |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Lint and auto-fix |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Format code |
| `test` | `jest` | Run unit tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:cov` | `jest --coverage` | Run tests with coverage |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | Run end-to-end tests |

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | ^10.0.0 | NestJS core |
| `@nestjs/core` | ^10.0.0 | NestJS core |
| `@nestjs/platform-express` | ^10.0.0 | Express platform adapter |
| `@nestjs/config` | ^4.0.3 | Environment configuration |
| `@nestjs/axios` | ^4.0.1 | HTTP client integration |
| `@prisma/client` | ^6.19.2 | Prisma ORM client |
| `prisma` | ^6.19.2 | Prisma CLI |
| `axios` | ^1.13.6 | HTTP client for orchestrator requests |
| `class-validator` | ^0.15.1 | Request body validation |
| `class-transformer` | ^0.5.1 | DTO transformation |
| `rxjs` | ^7.8.1 | Reactive programming |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/cli` | ^10.0.0 | NestJS CLI tooling |
| `typescript` | ^5.1.3 | TypeScript compiler |
| `jest` | ^29.5.0 | Test runner |
| `eslint` | ^8.42.0 | Linting |
| `prettier` | ^3.0.0 | Code formatting |
