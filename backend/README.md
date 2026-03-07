# Backend -- NestJS API Gateway

The backend is a NestJS 10 API gateway that serves as the persistence layer and SSE streaming proxy between the Angular frontend and the Python orchestrator. It manages conversations and messages in SQLite via Prisma, validates requests, and forwards chat queries to the orchestrator while streaming responses back to the client.

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
┌─────────────────────────────────────────────────────────────┐
│  NestJS Application (port 3000, prefix /api)                 │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ Conversations   │  │  Chat          │  │  Notes        │  │
│  │ Module          │  │  Module        │  │  Module       │  │
│  │                │  │                │  │               │  │
│  │ Controller     │  │ Controller     │  │ Controller    │  │
│  │ Service        │  │ Service        │  │ Service       │  │
│  │ DTO            │  │ DTO            │  │               │  │
│  └───────┬────────┘  └───────┬────────┘  └───────┬───────┘  │
│          │                   │                   │           │
│          └───────────┬───────┘                   │           │
│                      │                           │           │
│  ┌───────────────────▼───────────────────────────▼────────┐  │
│  │                 PrismaModule (Global)                    │  │
│  │                 PrismaService                           │  │
│  │                 SQLite via Prisma 6                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 ConfigModule (Global)                    │  │
│  │                 .env file loading                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP (axios)
                           ▼
              ┌──────────────────────┐
              │ Python Orchestrator  │
              │ (port 8000)          │
              └──────────────────────┘
```

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

**Imports:** `ConversationsModule` (to use `ConversationsService.findOne()`)

### NotesModule

**Files:** `src/modules/notes/`

Proxy endpoints for notes operations. The actual notes storage is in the Python orchestrator's SQLite database (via `notes_router.py`).

**Controller:** `NotesController` -- prefix `notes`

**Service:** `NotesService` -- forwards requests to the orchestrator via axios

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
| `POST` | `/api/conversations/:id/messages/stream` | Stream a chat response | `StreamChatDto` | SSE event stream (`text/event-stream`) |

### Notes

| Method | Path | Description | Query Params | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/notes` | List notes | `paper_id?`, `tags?`, `limit?` | `Note[]` |
| `GET` | `/api/notes/search` | Semantic search notes | `q` (required), `limit?` | `Note[]` (with `score` field) |
| `DELETE` | `/api/notes/:id` | Delete a note | -- | 204 No Content |

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
}
```

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
2. Save the user's message to the database
3. Create a placeholder assistant message (empty content)
4. Set SSE response headers (`Content-Type: text/event-stream`, etc.)
5. Build the message history from the conversation's existing messages
6. Forward the request to the Python orchestrator via axios with `responseType: 'stream'`
7. Pipe incoming chunks directly to the client response
8. Accumulate token content and papers for database persistence
9. On stream end: update the assistant message with accumulated content and papers
10. Update the conversation's `updatedAt` timestamp
11. End the response

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

# Create/apply migrations (creates data/app.db)
npx prisma migrate dev --name init
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
