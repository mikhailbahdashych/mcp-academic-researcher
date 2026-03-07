/**
 * Shapes of raw JSON objects returned by the NestJS backend.
 * Dates arrive as ISO 8601 strings, and the `papers` field on messages
 * is a JSON-serialized string (not a parsed array).
 *
 * These types are mapped to frontend models (ChatSession, Message)
 * by `SessionService.hydrateSession()` during application startup.
 */

/**
 * Raw message object as returned by the backend API.
 * The `papers` field is a JSON string containing a serialized `Paper[]`,
 * or null for user messages.
 */
export interface ApiMessage {
  /** Message UUID. */
  id: string;
  /** Parent conversation UUID. */
  conversationId: string;
  /** Message role: "user" or "assistant". */
  role: 'user' | 'assistant';
  /** Text content of the message. */
  content: string;
  /** JSON-serialized Paper[] or null. Parsed during hydration. */
  papers: string | null;
  /** ISO 8601 timestamp string. Converted to Date during hydration. */
  createdAt: string;
}

/**
 * Raw conversation object as returned by the backend API.
 * Includes nested messages ordered by creation time (ascending).
 */
export interface ApiConversation {
  /** Conversation UUID (may be client-generated). */
  id: string;
  /** Conversation title. */
  title: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-update timestamp. */
  updatedAt: string;
  /** Messages in chronological order. */
  messages: ApiMessage[];
}
