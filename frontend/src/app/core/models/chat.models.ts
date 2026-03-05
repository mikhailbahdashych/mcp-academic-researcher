export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url?: string;
  doi?: string;
  venue?: string;
  citationCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  papers?: Paper[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  papers: Paper[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  query: string;
  sessionId?: string;
}

export interface SSEEvent {
  type: 'token' | 'papers' | 'done' | 'error';
  data: string | Paper[] | null;
}
