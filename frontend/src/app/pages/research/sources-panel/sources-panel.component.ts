import { Component, Input, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../../core/services/session.service';
import { StreamingService } from '../../../core/services/streaming.service';
import { PaperCardComponent } from '../../../shared/components/paper-card/paper-card.component';

@Component({
  selector: 'app-sources-panel',
  standalone: true,
  imports: [MatProgressSpinnerModule, PaperCardComponent],
  templateUrl: './sources-panel.component.html',
  styleUrl: './sources-panel.component.scss',
})
export class SourcesPanelComponent {
  @Input({ required: true }) sessionId!: string;

  protected readonly sessionService = inject(SessionService);
  protected readonly streamingService = inject(StreamingService);

  readonly papers = computed(() =>
    this.sessionService.getSession(this.sessionId)?.papers ?? []
  );

  readonly isStreaming = this.streamingService.isStreaming;
}
