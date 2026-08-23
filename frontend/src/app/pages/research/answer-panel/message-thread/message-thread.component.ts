import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Message } from '@core/models/chat.models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

/**
 * Renders the conversation turns and keeps the viewport pinned to the newest
 * one while an answer streams in. Answer-action intents bubble up to the panel.
 */
@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [MessageBubbleComponent],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.scss',
})
export class MessageThreadComponent implements AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() isStreaming = false;
  /** Number of sources in the session — bounds the citation chips. */
  @Input() maxCitations = 0;

  @Output() saveNote = new EventEmitter<Message>();
  @Output() rewrite = new EventEmitter<Message>();

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLDivElement>;

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.isStreaming || this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
