import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ChatSession, Message, Paper } from '../models/chat.models';
import { ApiConversation } from '@api-types/api.types';
import { ApiService } from './api.service';

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

  setActiveSession(id: string): void {
    this._activeSessionId.set(id);
  }

  getSession(id: string): ChatSession | undefined {
    return this._sessions().find(s => s.id === id);
  }

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

  clearAll(): void {
    this._sessions.set([]);
    this._activeSessionId.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

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

  setPapers(sessionId: string, papers: Paper[]): void {
    this.updateSession(sessionId, session => ({
      ...session,
      papers,
      updatedAt: new Date(),
    }));
    this.saveToStorage();
  }

  private updateSession(id: string, updater: (s: ChatSession) => ChatSession): void {
    this._sessions.update(sessions =>
      sessions.map(s => (s.id === id ? updater(s) : s))
    );
  }
}
