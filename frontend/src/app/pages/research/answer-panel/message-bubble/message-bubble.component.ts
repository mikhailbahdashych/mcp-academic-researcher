import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '../../../../core/models/chat.models';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { StreamingCursorComponent } from '../streaming-cursor/streaming-cursor.component';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [MatIconModule, MarkdownViewerComponent, StreamingCursorComponent],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
}
