import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionService } from '@core/services/session.service';
import { ChatSession } from '@core/models/chat.models';

/**
 * History page: search over saved research threads, with a row per thread
 * (title, answer snippet, date and source count) and a hover delete action.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, RouterLink, MatTooltipModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  protected readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  // Local search — will be replaced by backend search + pagination
  readonly searchQuery = signal('');

  readonly filteredSessions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.sessionService.sessions();
    return this.sessionService.sessions().filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  });

  getSnippet(session: ChatSession): string {
    const msg = session.messages.find(m => m.role === 'assistant' && m.content);
    return msg?.content?.slice(0, 160).trim() ?? '';
  }

  formatDate(session: ChatSession): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(session.createdAt));
  }

  onDelete(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.sessionService.deleteSession(id);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
