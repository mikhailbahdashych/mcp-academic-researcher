import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { SessionService } from '@core/services/session.service';
import { StreamingService } from '@core/services/streaming.service';
import { CitationFocusService } from '@core/services/citation-focus.service';
import {
  PaperCardComponent,
  CitationLookup,
} from '@shared/components/paper-card/paper-card.component';

/** How long a source row stays highlighted after a citation chip click. */
const HIGHLIGHT_MS = 1200;

/**
 * Right-hand rail listing the papers accumulated for the current session.
 *
 * Rows expand in place to reveal the abstract and per-paper actions. A citation
 * chip in the answer publishes the source it names through CitationFocusService,
 * which the rail turns into "expand, scroll into view, flash".
 */
@Component({
  selector: 'app-sources-panel',
  standalone: true,
  imports: [PaperCardComponent],
  templateUrl: './sources-panel.component.html',
  styleUrl: './sources-panel.component.scss',
})
export class SourcesPanelComponent implements OnDestroy {
  @Input({ required: true }) sessionId!: string;
  @Output() citationLookup = new EventEmitter<CitationLookup>();

  protected readonly sessionService = inject(SessionService);
  protected readonly streamingService = inject(StreamingService);
  private readonly citationFocus = inject(CitationFocusService);

  readonly papers = computed(() =>
    this.sessionService.getSession(this.sessionId)?.papers ?? []
  );

  readonly isStreaming = this.streamingService.isStreaming;

  readonly expandedId = signal<string | null>(null);
  readonly highlightedIndex = signal<number | null>(null);

  private highlightTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(
      () => {
        const paperId = this.citationFocus.focusedPaperId();
        const focusedIndex = this.citationFocus.focusedIndex();
        this.citationFocus.tick();

        const papers = untracked(() => this.papers());
        // An id says which source the answer meant, whatever position the rail
        // now lists it at; a bare index is the positional fallback for threads
        // whose messages carry no source list of their own.
        const position = paperId
          ? papers.findIndex(p => p.id === paperId) + 1
          : focusedIndex ?? 0;

        const paper = papers[position - 1];
        if (!paper) return;

        this.expandedId.set(paper.id);
        this.highlightedIndex.set(position);

        queueMicrotask(() =>
          document
            .getElementById(`source-${position}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        );

        clearTimeout(this.highlightTimer);
        this.highlightTimer = setTimeout(
          () => this.highlightedIndex.set(null),
          HIGHLIGHT_MS
        );
      },
      { allowSignalWrites: true }
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.highlightTimer);
  }

  toggleExpanded(paperId: string): void {
    this.expandedId.update(current => (current === paperId ? null : paperId));
  }
}
