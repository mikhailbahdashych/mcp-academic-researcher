import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatSession } from '@core/models/chat.models';
import { StreamingService } from '@core/services/streaming.service';

@Component({
  selector: 'app-session-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatTooltipModule],
  templateUrl: './session-item.component.html',
  styleUrl: './session-item.component.scss',
})
export class SessionItemComponent {
  @Input({ required: true }) session!: ChatSession;
  @Output() deleteSession = new EventEmitter<string>();

  readonly isStreaming = inject(StreamingService).isStreaming;
}
