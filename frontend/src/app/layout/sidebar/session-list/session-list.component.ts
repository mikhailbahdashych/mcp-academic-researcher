import { Component, computed, inject } from '@angular/core';
import { SessionItemComponent } from '../session-item/session-item.component';
import { SessionService } from '../../../core/services/session.service';
import { ChatSession } from '../../../core/models/chat.models';

interface SessionGroup {
  label: string;
  sessions: ChatSession[];
}

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [SessionItemComponent],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  private readonly sessionService = inject(SessionService);

  readonly groups = computed<SessionGroup[]>(() => {
    const sessions = this.sessionService.sessions();
    if (!sessions.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const todaySessions: ChatSession[] = [];
    const yesterdaySessions: ChatSession[] = [];
    const thisWeekSessions: ChatSession[] = [];
    const olderSessions: ChatSession[] = [];

    for (const s of sessions) {
      const d = new Date(s.createdAt);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (dayStart >= today) todaySessions.push(s);
      else if (dayStart >= yesterday) yesterdaySessions.push(s);
      else if (dayStart >= weekAgo) thisWeekSessions.push(s);
      else olderSessions.push(s);
    }

    return [
      { label: 'Today', sessions: todaySessions },
      { label: 'Yesterday', sessions: yesterdaySessions },
      { label: 'This Week', sessions: thisWeekSessions },
      { label: 'Older', sessions: olderSessions },
    ].filter(g => g.sessions.length > 0);
  });

  onDelete(id: string): void {
    this.sessionService.deleteSession(id);
  }
}
