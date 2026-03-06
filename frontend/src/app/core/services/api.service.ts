import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConversation } from '@api-types/api.types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE = '/api';

  getConversations(): Observable<ApiConversation[]> {
    return this.http.get<ApiConversation[]>(`${this.BASE}/conversations`);
  }

  createConversation(id: string, title: string): Observable<ApiConversation> {
    return this.http.post<ApiConversation>(`${this.BASE}/conversations`, { id, title });
  }

  getConversation(id: string): Observable<ApiConversation> {
    return this.http.get<ApiConversation>(`${this.BASE}/conversations/${id}`);
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/conversations/${id}`);
  }
}
