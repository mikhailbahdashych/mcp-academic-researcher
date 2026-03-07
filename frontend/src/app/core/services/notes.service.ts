import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);

  getNotes(paperId?: string, tags?: string, limit?: number): Observable<Note[]> {
    let params = new HttpParams();
    if (paperId) params = params.set('paper_id', paperId);
    if (tags) params = params.set('tags', tags);
    if (limit != null) params = params.set('limit', limit.toString());
    return this.http.get<Note[]>('/api/notes', { params });
  }

  searchNotes(q: string, limit?: number): Observable<Note[]> {
    let params = new HttpParams().set('q', q);
    if (limit != null) params = params.set('limit', limit.toString());
    return this.http.get<Note[]>('/api/notes/search', { params });
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`);
  }
}
