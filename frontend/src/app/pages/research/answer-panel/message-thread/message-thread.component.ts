import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { Message } from '../../../../core/models/chat.models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

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
