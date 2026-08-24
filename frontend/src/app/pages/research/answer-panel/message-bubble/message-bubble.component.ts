import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from '@core/models/chat.models';
import { CitationFocusService } from '@core/services/citation-focus.service';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { StreamingCursorComponent } from '../streaming-cursor/streaming-cursor.component';

/**
 * A single turn in the thread: a right-aligned user bubble, or an assistant
 * answer with its avatar, markdown body and the Copy / Save note / Rewrite
 * actions (shown only once the answer has finished streaming).
 */
@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [MarkdownViewerComponent, StreamingCursorComponent],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  /** Number of sources this answer cited — bounds which `[n]` markers become chips. */
  @Input() maxCitations = 0;
  /** Disables Rewrite while another answer is streaming. */
  @Input() disableRewrite = false;

  @Output() saveNote = new EventEmitter<Message>();
  @Output() rewrite = new EventEmitter<Message>();

  private readonly snackBar = inject(MatSnackBar);
  private readonly citationFocus = inject(CitationFocusService);

  /**
   * Resolves a clicked citation number to the source it actually names.
   *
   * The model numbers `[n]` by its own source list for this turn, so the paper
   * at that position in *this message* is the one the rail must reveal — the
   * session-wide list has grown since and would point at the wrong row. Threads
   * saved before messages carried papers have no list, and fall back to the
   * positional lookup the rail did before.
   */
  onCiteClick(index: number): void {
    const paper = this.message.papers?.[index - 1];
    if (paper) this.citationFocus.focusPaper(paper.id);
    else this.citationFocus.focus(index);
  }

  copy(): void {
    navigator.clipboard
      .writeText(this.message.content)
      .then(() => this.snackBar.open('Copied', '', { duration: 1600 }))
      .catch(() => this.snackBar.open('Copy failed', '', { duration: 1600 }));
  }
}
