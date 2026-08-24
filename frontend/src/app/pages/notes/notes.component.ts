import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { Note } from '@core/models/chat.models';
import { NotesService } from '@core/services/notes.service';
import { NoteCardComponent } from './note-card/note-card.component';

/**
 * Notes page: semantic search over saved notes (debounced, falling back to a
 * plain listing when the query is empty) rendered as note cards.
 */
@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [FormsModule, MatProgressSpinnerModule, MatTooltipModule, NoteCardComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent implements OnDestroy {
  private readonly notesService = inject(NotesService);
  private readonly destroy$ = new Subject<void>();

  readonly searchQuery = signal('');
  readonly notes = signal<Note[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly _searchSub = toObservable(this.searchQuery)
    .pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading.set(true);
        this.error.set(null);
        return q.trim() ? this.notesService.searchNotes(q.trim()) : this.notesService.getNotes();
      }),
      takeUntil(this.destroy$),
    )
    .subscribe({
      next: notes => {
        this.notes.set(notes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load notes. Is the orchestrator running?');
        this.loading.set(false);
      },
    });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDelete(id: string): void {
    this.notes.update(notes => notes.filter(n => n.id !== id));
    this.notesService.deleteNote(id).subscribe({
      error: () => {
        // Re-fetch on failure to restore accurate state
        this.reload();
      },
    });
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  private reload(): void {
    const q = this.searchQuery().trim();
    const obs = q ? this.notesService.searchNotes(q) : this.notesService.getNotes();
    obs.subscribe({ next: notes => this.notes.set(notes) });
  }
}
