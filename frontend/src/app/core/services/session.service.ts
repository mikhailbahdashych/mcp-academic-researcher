import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ChatSession, Message, Paper } from '../models/chat.models';
import { ApiConversation } from '@api-types/api.types';
import { ApiService } from './api.service';

/**
 * Signal-based session state manager for research conversations.
 *
 * Acts as the single source of truth for conversation sessions on the client.
 * Hydrates from the backend on startup, caches to localStorage for instant display,
 * and syncs mutations (create, delete) back to the backend via ApiService.
 *
 * Uses Angular Signals for synchronous reactive state and RxJS for HTTP operations.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly STORAGE_KEY = 'mcp_sessions';
  private readonly api = inject(ApiService);

  private _sessions = signal<ChatSession[]>(this.loadFromStorage());
  private _activeSessionId = signal<string | null>(null);

  readonly sessions = this._sessions.asReadonly();
  readonly activeSession = computed(() =>
    this._sessions().find(s => s.id === this._activeSessionId())
  );

  constructor() {
    this.api
      .getConversations()
      .pipe(catchError(() => of(null)))
      .subscribe(conversations => {
        if (conversations) {
          this._sessions.set(conversations.map(c => this.hydrateSession(c)));
          this.saveToStorage();
        }
      });
  }

  /**
   * Maps a raw backend ApiConversation to a frontend ChatSession.
   * Converts ISO date strings to Date objects and parses JSON-serialized papers.
   * @param c - Raw conversation from the backend API.
   * @returns Hydrated ChatSession with proper Date objects and parsed Paper arrays.
   */
  private hydrateSession(c: ApiConversation): ChatSession {
    const messages = (c.messages ?? []).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.createdAt),
      papers: m.papers ? (JSON.parse(m.papers) as Paper[]) : undefined,
    }));

    // Restore session-level papers from the last assistant message that has them
    const lastPapers = messages
      .filter(m => m.role === 'assistant' && m.papers?.length)
      .at(-1)?.papers ?? [];

    return {
      id: c.id,
      title: c.title,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      papers: lastPapers,
      messages,
    };
  }

  private loadFromStorage(): ChatSession[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatSession[];
      return parsed.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      }));
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._sessions()));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Creates a new session with a client-generated UUID.
   * Sends a fire-and-forget POST to the backend to persist the conversation.
   * The first user message is added as the initial message.
   * @param query - The initial user query, also used as the session title.
   * @returns The newly created ChatSession.
   */
  createSession(query: string): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: query,
      messages: [
        { id: crypto.randomUUID(), role: 'user', content: query, timestamp: new Date() },
      ],
      papers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Fire-and-forget: backend creates conversation with the same client-generated UUID
    this.api
      .createConversation(session.id, query)
      .pipe(catchError(() => of(null)))
      .subscribe();

    this._sessions.update(sessions => [session, ...sessions]);
    this._activeSessionId.set(session.id);
    this.saveToStorage();
    return session;
  }

  /** Sets the currently active session by ID. */
  setActiveSession(id: string): void {
    this._activeSessionId.set(id);
  }

  /** Retrieves a session by ID from the in-memory store. */
  getSession(id: string): ChatSession | undefined {
    return this._sessions().find(s => s.id === id);
  }

  /**
   * Deletes a session locally and on the backend.
   * Clears the active session if it matches the deleted one.
   * @param id - Session UUID to delete.
   */
  deleteSession(id: string): void {
    this.api
      .deleteConversation(id)
      .pipe(catchError(() => of(null)))
      .subscribe();

    this._sessions.update(sessions => sessions.filter(s => s.id !== id));
    if (this._activeSessionId() === id) {
      this._activeSessionId.set(null);
    }
    this.saveToStorage();
  }

  /** Removes all sessions from memory and localStorage. */
  clearAll(): void {
    this._sessions.set([]);
    this._activeSessionId.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /** Appends a user message to the specified session and persists to localStorage. */
  addUserMessage(sessionId: string, content: string): void {
    this.updateSession(sessionId, session => ({
      ...session,
      messages: [
        ...session.messages,
        { id: crypto.randomUUID(), role: 'user' as const, content, timestamp: new Date() },
      ],
      updatedAt: new Date(),
    }));
    this.saveToStorage();
  }

  /**
   * Creates a placeholder assistant message with isStreaming=true.
   * @param sessionId - Session to add the message to.
   * @returns The generated message UUID (used to append tokens during streaming).
   */
  addAssistantMessage(sessionId: string): string {
    const messageId = crypto.randomUUID();
    this.updateSession(sessionId, session => ({
      ...session,
      messages: [
        ...session.messages,
        { id: messageId, role: 'assistant' as const, content: '', timestamp: new Date(), isStreaming: true },
      ],
      updatedAt: new Date(),
    }));
    return messageId;
  }

  /**
   * Appends a text token to an in-progress assistant message.
   * Does not persist to localStorage during streaming for performance.
   * @param sessionId - Session containing the message.
   * @param messageId - ID of the streaming assistant message.
   * @param token - Text fragment to append.
   */
  appendToken(sessionId: string, messageId: string, token: string): void {
    this._sessions.update(sessions =>
      sessions.map(s =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m: Message) =>
                m.id !== messageId ? m : { ...m, content: m.content + token }
              ),
            }
      )
    );
  }

  /**
   * Records the source list one answer resolved to, on that answer's message.
   *
   * The model numbers its `[n]` markers against its own final source list for
   * that turn, so a citation can only be resolved through the papers of the
   * message that wrote it — the session-level list accumulates across turns and
   * renumbers everything from turn two on. `hydrateSession` already restores
   * this from the backend; this keeps a live stream consistent with a reload.
   *
   * Like `appendToken` this does not touch localStorage: `finalizeMessage`
   * persists once the stream is done.
   *
   * @param sessionId - Session containing the message.
   * @param messageId - ID of the assistant message the papers belong to.
   * @param papers - The turn's source list, in the order the model numbered it.
   */
  setMessagePapers(sessionId: string, messageId: string, papers: Paper[]): void {
    this._sessions.update(sessions =>
      sessions.map(s =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m: Message) =>
                m.id !== messageId ? m : { ...m, papers: [...papers] }
              ),
            }
      )
    );
  }

  /**
   * Marks a message as no longer streaming and persists to localStorage.
   * Called when the SSE stream completes or errors.
   */
  finalizeMessage(sessionId: string, messageId: string): void {
    this.updateSession(sessionId, session => ({
      ...session,
      messages: session.messages.map(m =>
        m.id !== messageId ? m : { ...m, isStreaming: false }
      ),
      updatedAt: new Date(),
    }));
    this.saveToStorage();
  }

  /**
   * Deduplicates and appends papers to the session-level paper list.
   * Deduplication is by both paper ID and normalized (lowercased) title.
   * @param sessionId - Session to add papers to.
   * @param incoming - New papers from the stream.
   */
  addPapers(sessionId: string, incoming: Paper[]): void {
    this.updateSession(sessionId, session => {
      const existing = session.papers;
      const seenIds = new Set(existing.map(p => p.id));
      const seenTitles = new Set(existing.map(p => p.title.toLowerCase().trim()));
      const novel = incoming.filter(
        p => !seenIds.has(p.id) && !seenTitles.has(p.title.toLowerCase().trim())
      );
      return { ...session, papers: [...existing, ...novel], updatedAt: new Date() };
    });
    this.saveToStorage();
  }

  private updateSession(id: string, updater: (s: ChatSession) => ChatSession): void {
    this._sessions.update(sessions =>
      sessions.map(s => (s.id === id ? updater(s) : s))
    );
  }
}
