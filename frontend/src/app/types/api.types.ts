/**
 * Shapes of raw JSON objects returned by the NestJS backend.
 * Dates are ISO strings, papers are JSON-serialized strings.
 * These are mapped to frontend models (ChatSession, Message) during hydration.
 */

export interface ApiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  papers: string | null;
  createdAt: string;
}

export interface ApiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ApiMessage[];
}
