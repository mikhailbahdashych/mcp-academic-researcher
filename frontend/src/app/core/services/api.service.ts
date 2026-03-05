import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatSession } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE = '/api';

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.BASE}/sessions`);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/sessions/${id}`);
  }
}
