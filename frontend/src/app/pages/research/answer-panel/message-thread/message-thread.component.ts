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
  /**
   * Number of sources in the session — the citation bound for messages that
   * carry no source list of their own (threads saved before per-message papers).
   */
  @Input() fallbackCitations = 0;

  @Output() saveNote = new EventEmitter<Message>();
  @Output() rewrite = new EventEmitter<Message>();

  /**
   * How many `[n]` markers become chips in one turn.
   *
   * The model numbers its citations against its own source list for that turn,
   * so the bound is per message, not per session.
   */
  citationBound(message: Message): number {
    return message.papers?.length || this.fallbackCitations;
  }

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
