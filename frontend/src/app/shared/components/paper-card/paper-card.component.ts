import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Paper } from '@core/models/chat.models';

export interface CitationLookup {
  type: 'citations' | 'references';
  paperId: string;
  paperTitle: string;
}

@Component({
  selector: 'app-paper-card',
  standalone: true,
  imports: [DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './paper-card.component.html',
  styleUrl: './paper-card.component.scss',
})
export class PaperCardComponent {
  @Input({ required: true }) paper!: Paper;
  @Input() index?: number;
  @Output() citationLookup = new EventEmitter<CitationLookup>();

  private readonly snackBar = inject(MatSnackBar);

  get isOpenAlex(): boolean {
    return this.paper.source === 'openalex' && !!this.paper.id;
  }

  onCitationsClick(): void {
    this.citationLookup.emit({ type: 'citations', paperId: this.paper.id, paperTitle: this.paper.title });
  }

  onReferencesClick(): void {
    this.citationLookup.emit({ type: 'references', paperId: this.paper.id, paperTitle: this.paper.title });
  }

  expanded = false;

  get authorsDisplay(): string {
    if (!this.paper.authors?.length) return 'Unknown authors';
    if (this.paper.authors.length <= 3) return this.paper.authors.join(', ');
    return `${this.paper.authors.slice(0, 3).join(', ')} +${this.paper.authors.length - 3} more`;
  }

  copyCitation(): void {
    const citation = this.buildCitation();
    navigator.clipboard.writeText(citation).then(() => {
      this.snackBar.open('Citation copied!', '', {
        duration: 2000,
        panelClass: ['citation-snack'],
      });
    });
  }

  openUrl(): void {
    if (this.paper.url) window.open(this.paper.url, '_blank', 'noopener');
  }

  private buildCitation(): string {
    const authors = this.paper.authors?.join(', ') ?? 'Unknown';
    const year = this.paper.year ?? 'n.d.';
    const title = this.paper.title;
    const venue = this.paper.venue ? ` ${this.paper.venue}.` : '';
    const doi = this.paper.doi ? ` DOI: ${this.paper.doi}` : '';
    return `${authors} (${year}). ${title}.${venue}${doi}`;
  }
}
