import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConversation } from '@api-types/api.types';

/**
 * HTTP client for conversation CRUD operations against the NestJS backend.
 * All requests are sent to /api/conversations via Angular HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE = '/api';

  /** Fetches all conversations with their messages, ordered by updatedAt descending. */
  getConversations(): Observable<ApiConversation[]> {
    return this.http.get<ApiConversation[]>(`${this.BASE}/conversations`);
  }

  /**
   * Creates a conversation with a client-supplied UUID.
   * @param id - Client-generated UUID for the conversation.
   * @param title - Conversation title (typically the first user query).
   */
  createConversation(id: string, title: string): Observable<ApiConversation> {
    return this.http.post<ApiConversation>(`${this.BASE}/conversations`, { id, title });
  }

  /** Fetches a single conversation by ID, including all messages. */
  getConversation(id: string): Observable<ApiConversation> {
    return this.http.get<ApiConversation>(`${this.BASE}/conversations/${id}`);
  }

  /** Deletes a conversation and all its messages (cascade). Returns 204. */
  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/conversations/${id}`);
  }
}
