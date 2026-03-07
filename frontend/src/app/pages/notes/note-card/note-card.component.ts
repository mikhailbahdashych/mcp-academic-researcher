import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Note } from '@core/models/chat.models';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatIconModule, MatTooltipModule],
  templateUrl: './note-card.component.html',
  styleUrl: './note-card.component.scss',
})
export class NoteCardComponent {
  @Input({ required: true }) note!: Note;
  @Output() deleted = new EventEmitter<string>();

  private readonly snackBar = inject(MatSnackBar);
  readonly expanded = signal(false);

  get paperIds(): string[] {
    return this.note.paper_id
      ? this.note.paper_id.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  }

  copyDoi(doi: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(doi).then(() => {
      this.snackBar.open('DOI copied', '', { duration: 1500 });
    });
  }

  toggleExpand(): void {
    this.expanded.set(!this.expanded());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleted.emit(this.note.id);
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  scorePercent(score: number): string {
    // Distance-based: lower is better. Convert to 0-100% similarity.
    const similarity = Math.max(0, 1 - score);
    return `${Math.round(similarity * 100)}%`;
  }
}
