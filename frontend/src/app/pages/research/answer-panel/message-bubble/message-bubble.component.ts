import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from '@core/models/chat.models';
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
  /** Number of sources in the session — bounds which `[n]` markers become chips. */
  @Input() maxCitations = 0;
  /** Disables Rewrite while another answer is streaming. */
  @Input() disableRewrite = false;

  @Output() saveNote = new EventEmitter<Message>();
  @Output() rewrite = new EventEmitter<Message>();

  private readonly snackBar = inject(MatSnackBar);

  copy(): void {
    navigator.clipboard.writeText(this.message.content).then(() => {
      this.snackBar.open('Copied', '', { duration: 1600 });
    });
  }
}
