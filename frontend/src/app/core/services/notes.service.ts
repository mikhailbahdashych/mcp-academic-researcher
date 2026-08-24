import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/chat.models';

/** Payload accepted by the create-note endpoint. */
export interface CreateNoteInput {
  title: string;
  content: string;
  /** Comma-separated paper IDs the note refers to, or null. */
  paper_id?: string | null;
  tags?: string[];
}

/**
 * HTTP client for notes management endpoints.
 * Notes are stored in the orchestrator's SQLite database and accessed
 * via the NestJS backend, which proxies to the orchestrator.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);

  /**
   * Lists notes with optional filters.
   * @param paperId - Filter by associated paper ID.
   * @param tags - Comma-separated tag filter string.
   * @param limit - Maximum number of results.
   */
  getNotes(paperId?: string, tags?: string, limit?: number): Observable<Note[]> {
    let params = new HttpParams();
    if (paperId) params = params.set('paper_id', paperId);
    if (tags) params = params.set('tags', tags);
    if (limit != null) params = params.set('limit', limit.toString());
    return this.http.get<Note[]>('/api/notes', { params });
  }

  /** Performs semantic vector search over notes via the orchestrator. */
  searchNotes(q: string, limit?: number): Observable<Note[]> {
    let params = new HttpParams().set('q', q);
    if (limit != null) params = params.set('limit', limit.toString());
    return this.http.get<Note[]>('/api/notes/search', { params });
  }

  /** Creates a note (used by the "Save note" action on an answer). */
  createNote(input: CreateNoteInput): Observable<Note> {
    return this.http.post<Note>('/api/notes', input);
  }

  /** Deletes a note by ID. */
  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`);
  }
}
