import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Paper } from '@core/models/chat.models';

export interface CitationLookup {
  type: 'citations' | 'references';
  paperId: string;
  paperTitle: string;
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

/** Abstracts longer than this get a Show more / Show less toggle. */
const ABSTRACT_TOGGLE_THRESHOLD = 320;

/**
 * One row of the sources rail: index, title and meta line, expanding in place to
 * reveal the authors, abstract and per-paper actions.
 */
@Component({
  selector: 'app-paper-card',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './paper-card.component.html',
  styleUrl: './paper-card.component.scss',
})
export class PaperCardComponent implements OnChanges {
  @Input({ required: true }) paper!: Paper;
  /** Zero-based position in the rail; rendered 1-based. */
  @Input() index?: number;
  @Input() expanded = false;
  /** Flashes the row when a citation chip points at it. */
  @Input() highlighted = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() citationLookup = new EventEmitter<CitationLookup>();

  abstractOpen = false;

  private readonly snackBar = inject(MatSnackBar);

  ngOnChanges(changes: SimpleChanges): void {
    // Collapsing the row resets the abstract so it reopens clamped.
    if (changes['expanded'] && !this.expanded) this.abstractOpen = false;
  }

  get isOpenAlex(): boolean {
    return this.paper.source === 'openalex' && !!this.paper.id;
  }

  /** `venue · year · N cites`, omitting whatever the paper does not carry. */
  get metaLine(): string {
    const venue = this.paper.venue ?? this.sourceLabel;
    const citations =
      this.paper.citationCount != null
        ? `${NUMBER_FORMAT.format(this.paper.citationCount)} cites`
        : null;

    return [venue, this.paper.year, citations].filter(Boolean).join(' · ');
  }

  get authorsDisplay(): string {
    const authors = this.paper.authors;
    if (!authors?.length) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} +${authors.length - 3} more`;
  }

  get showAbstractToggle(): boolean {
    return (this.paper.abstract?.length ?? 0) > ABSTRACT_TOGGLE_THRESHOLD;
  }

  onCitationsClick(): void {
    this.citationLookup.emit({
      type: 'citations',
      paperId: this.paper.id,
      paperTitle: this.paper.title,
    });
  }

  onReferencesClick(): void {
    this.citationLookup.emit({
      type: 'references',
      paperId: this.paper.id,
      paperTitle: this.paper.title,
    });
  }

  copyCitation(): void {
    navigator.clipboard.writeText(this.buildCitation()).then(() => {
      this.snackBar.open('Citation copied', '', { duration: 1600 });
    });
  }

  openUrl(): void {
    if (this.paper.url) window.open(this.paper.url, '_blank', 'noopener');
  }

  private get sourceLabel(): string | null {
    if (this.paper.source === 'arxiv') return 'arXiv';
    if (this.paper.source === 'openalex') return 'OpenAlex';
    return null;
  }

  private buildCitation(): string {
    const authors = this.paper.authors?.join(', ') ?? 'Unknown';
    const year = this.paper.year ?? 'n.d.';
    const venue = this.paper.venue ? ` ${this.paper.venue}.` : '';
    const doi = this.paper.doi ? ` DOI: ${this.paper.doi}` : '';
    return `${authors} (${year}). ${this.paper.title}.${venue}${doi}`;
  }
}
