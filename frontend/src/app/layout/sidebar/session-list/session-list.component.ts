import { Component, inject } from '@angular/core';
import { SessionItemComponent } from '../session-item/session-item.component';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [SessionItemComponent],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent {
  private readonly sessionService = inject(SessionService);

  /** Flat list of threads, already ordered most-recently-updated first. */
  readonly sessions = this.sessionService.sessions;

  onDelete(id: string): void {
    this.sessionService.deleteSession(id);
  }
}
