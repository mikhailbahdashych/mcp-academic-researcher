import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SessionService } from '@core/services/session.service';
import { StreamingService } from '@core/services/streaming.service';
import { SearchScopeService } from '@core/services/search-scope.service';
import { Paper, SSEEvent } from '@core/models/chat.models';

import { MessageThreadComponent } from './message-thread/message-thread.component';
import { QueryInputComponent } from '@shared/components/query-input/query-input.component';

/**
 * Core chat panel that manages the SSE streaming lifecycle.
 *
 * On initialization, checks whether the session's last message is an unanswered
 * user message and automatically starts streaming a response. Handles follow-up
 * queries and forced tool calls (for citation/reference lookups).
 *
 * Coordinates between SessionService (state), StreamingService (SSE transport),
 * and child components (message thread, query input).
 */
@Component({
  selector: 'app-answer-panel',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MessageThreadComponent,
    QueryInputComponent,
  ],
  templateUrl: './answer-panel.component.html',
  styleUrl: './answer-panel.component.scss',
})
export class AnswerPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) sessionId!: string;

  protected readonly sessionService = inject(SessionService);
  protected readonly streamingService = inject(StreamingService);
  private readonly searchScope = inject(SearchScopeService);

  protected readonly session = computed(() =>
    this.sessionService.getSession(this.sessionId)
  );

  protected readonly isStreaming = this.streamingService.isStreaming;

  private subscription?: Subscription;
  private currentMessageId?: string;

  ngOnInit(): void {
    this.sessionService.setActiveSession(this.sessionId);
    this.startStreamingIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId'] && !changes['sessionId'].firstChange) {
      this.subscription?.unsubscribe();
      this.sessionService.setActiveSession(this.sessionId);
      this.startStreamingIfNeeded();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private startStreamingIfNeeded(): void {
    const session = this.sessionService.getSession(this.sessionId);
    if (!session) return;

    const messages = session.messages;
    const last = messages[messages.length - 1];

    // Only stream if the last message is a user message (no assistant reply yet)
    if (!last || last.role !== 'user') return;

    this.currentMessageId = this.sessionService.addAssistantMessage(this.sessionId);

    this.subscription = this.streamingService
      .streamChat(this.sessionId, last.content, undefined, this.searchScope.sources())
      .subscribe({
        next: event => this.handleEvent(event),
        error: err => {
          console.error('Stream error:', err);
          if (this.currentMessageId) {
            this.sessionService.finalizeMessage(this.sessionId, this.currentMessageId);
          }
        },
        complete: () => {
          if (this.currentMessageId) {
            this.sessionService.finalizeMessage(this.sessionId, this.currentMessageId);
          }
        },
      });
  }

  private handleEvent(event: SSEEvent): void {
    if (event.type === 'token' && this.currentMessageId) {
      this.sessionService.appendToken(
        this.sessionId,
        this.currentMessageId,
        event.data as string
      );
    } else if (event.type === 'papers') {
      const papers = event.data as Paper[];
      if (papers.length > 0) {
        this.sessionService.addPapers(this.sessionId, papers);
      }
    }
  }

  onFollowUp(query: string): void {
    this._stream(query);
  }

  submitWithForcedTool(
    displayMessage: string,
    forceTool: { name: string; args: Record<string, unknown> },
  ): void {
    this._stream(displayMessage, forceTool);
  }

  private _stream(
    query: string,
    forceTool?: { name: string; args: Record<string, unknown> },
  ): void {
    this.sessionService.addUserMessage(this.sessionId, query);
    this.currentMessageId = this.sessionService.addAssistantMessage(this.sessionId);

    this.subscription?.unsubscribe();
    this.subscription = this.streamingService
      .streamChat(this.sessionId, query, forceTool, this.searchScope.sources())
      .subscribe({
        next: event => this.handleEvent(event),
        error: err => {
          console.error('Stream error:', err);
          if (this.currentMessageId) {
            this.sessionService.finalizeMessage(this.sessionId, this.currentMessageId);
          }
        },
        complete: () => {
          if (this.currentMessageId) {
            this.sessionService.finalizeMessage(this.sessionId, this.currentMessageId);
          }
        },
      });
  }
}
