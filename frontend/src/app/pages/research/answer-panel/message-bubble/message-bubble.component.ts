import { Component, Input, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from '@core/models/chat.models';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { StreamingCursorComponent } from '../streaming-cursor/streaming-cursor.component';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MarkdownViewerComponent, StreamingCursorComponent],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;

  private readonly snackBar = inject(MatSnackBar);

  copyContent(): void {
    navigator.clipboard.writeText(this.message.content).then(() => {
      this.snackBar.open('Copied to clipboard', '', { duration: 2000 });
    });
  }
}
