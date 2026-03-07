/**
 * Represents an academic paper returned by arXiv or OpenAlex search.
 */
export interface Paper {
  /** arXiv ID (e.g., "2301.12345v1") or DOI / OpenAlex URL. */
  id: string;
  /** Paper title. */
  title: string;
  /** List of author display names. */
  authors: string[];
  /** Publication year, or null if unknown. */
  year: number | null;
  /** Paper abstract text. */
  abstract: string;
  /** URL to the paper's landing page or PDF. */
  url?: string;
  /** Digital Object Identifier, if available. */
  doi?: string;
  /** Publication venue (journal or conference name). */
  venue?: string;
  /** Number of citations, if provided by the source. */
  citationCount?: number;
  /** Data source identifier: "arxiv" or "openalex". */
  source?: string;
}

/**
 * Represents a single message in a conversation thread.
 */
export interface Message {
  /** Unique message identifier (client-generated UUID). */
  id: string;
  /** Message author: "user" for human input, "assistant" for LLM responses. */
  role: 'user' | 'assistant';
  /** Text content of the message. For assistant messages, may contain markdown. */
  content: string;
  /** Papers discovered during this message's processing (assistant messages only). */
  papers?: Paper[];
  /** When the message was created. */
  timestamp: Date;
  /** True while the assistant message is still receiving streamed tokens. */
  isStreaming?: boolean;
}

/**
 * Represents a complete research conversation session.
 * Sessions are identified by client-generated UUIDs to avoid optimistic ID swaps.
 */
export interface ChatSession {
  /** Client-generated UUID, shared with the backend. */
  id: string;
  /** Session title, typically the first user query. */
  title: string;
  /** Ordered list of messages in the conversation. */
  messages: Message[];
  /** Accumulated unique papers discovered across all messages. */
  papers: Paper[];
  /** When the session was created. */
  createdAt: Date;
  /** When the session was last updated (message added or stream completed). */
  updatedAt: Date;
}

/**
 * Request payload for initiating a chat query.
 */
export interface ChatRequest {
  /** The user's research question. */
  query: string;
  /** Optional session ID for follow-up queries. */
  sessionId?: string;
}

/**
 * Represents a saved research note with semantic embedding metadata.
 * Notes are stored in the orchestrator's SQLite database with vector embeddings.
 */
export interface Note {
  /** Unique note identifier (UUID). */
  id: string;
  /** Note title. */
  title: string;
  /** Full note content text. */
  content: string;
  /** Comma-separated paper IDs associated with this note, or null. */
  paper_id: string | null;
  /** Tag strings for categorization. */
  tags: string[];
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 last-update timestamp. */
  updated_at: string;
  /** Vector search distance score (lower = more similar). Present only in search results. */
  score?: number;
}

/**
 * A parsed Server-Sent Event from the streaming chat endpoint.
 */
export interface SSEEvent {
  /** Event type discriminator. */
  type: 'token' | 'papers' | 'done' | 'error';
  /** Event payload: text token, paper array, null (done), or error message string. */
  data: string | Paper[] | null;
}
