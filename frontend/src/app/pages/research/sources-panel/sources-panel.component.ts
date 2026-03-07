import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '@core/services/session.service';
import { StreamingService } from '@core/services/streaming.service';
import { PaperCardComponent, CitationLookup } from '@shared/components/paper-card/paper-card.component';

/**
 * Displays accumulated paper sources for the current research session.
 *
 * Shows skeleton cards while streaming, an empty state when no papers exist,
 * and PaperCard instances for each discovered paper. Emits CitationLookup
 * events when the user clicks citation/reference buttons on a paper card.
 */
@Component({
  selector: 'app-sources-panel',
  standalone: true,
  imports: [MatProgressSpinnerModule, PaperCardComponent],
  templateUrl: './sources-panel.component.html',
  styleUrl: './sources-panel.component.scss',
})
export class SourcesPanelComponent {
  @Input({ required: true }) sessionId!: string;
  @Output() citationLookup = new EventEmitter<CitationLookup>();

  protected readonly sessionService = inject(SessionService);
  protected readonly streamingService = inject(StreamingService);

  readonly papers = computed(() =>
    this.sessionService.getSession(this.sessionId)?.papers ?? []
  );

  readonly isStreaming = this.streamingService.isStreaming;
}
