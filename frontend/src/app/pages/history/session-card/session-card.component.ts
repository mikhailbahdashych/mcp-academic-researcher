import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatSession } from '@core/models/chat.models';
import { StreamingService } from '@core/services/streaming.service';

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss',
})
export class SessionCardComponent {
  @Input({ required: true }) session!: ChatSession;
  @Output() delete = new EventEmitter<string>();

  readonly isStreaming = inject(StreamingService).isStreaming;

  get messageCount(): number {
    return this.session.messages.length;
  }

  get formattedDate(): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(this.session.createdAt));
  }
}
