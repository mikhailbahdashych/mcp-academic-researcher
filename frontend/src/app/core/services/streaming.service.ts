import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { SSEEvent } from '../models/chat.models';

/**
 * Handles SSE streaming for chat responses.
 *
 * Uses `fetch()` + `ReadableStream` instead of the browser's `EventSource` API
 * because SSE requires a POST body (EventSource only supports GET).
 *
 * Returns an RxJS Observable that emits parsed SSEEvent objects. Unsubscribing
 * from the Observable aborts the underlying fetch request.
 */
@Injectable({ providedIn: 'root' })
export class StreamingService {
  /** Whether a chat stream is currently in progress. */
  readonly isStreaming = signal(false);

  /**
   * Initiates a streaming POST request to the chat endpoint.
   *
   * @param conversationId - The conversation UUID.
   * @param query - The user's query text.
   * @param forceTool - Optional forced MCP tool call (e.g., for citation lookups).
   * @param sources - Optional paper sources to search (defaults to all server-side).
   * @returns Observable that emits SSEEvent objects (token, papers, done, error).
   *          Completes on `done` events; errors on `error` events.
   *          Unsubscribing aborts the fetch via AbortController.
   */
  streamChat(
    conversationId: string,
    query: string,
    forceTool?: { name: string; args: Record<string, unknown> },
    sources?: string[],
  ): Observable<SSEEvent> {
    return new Observable<SSEEvent>(subscriber => {
      const controller = new AbortController();
      this.isStreaming.set(true);

      fetch(`/api/conversations/${conversationId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          ...(forceTool ? { forceTool } : {}),
          ...(sources ? { sources } : {}),
        }),
        signal: controller.signal,
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();

                if (payload === '[DONE]') {
                  subscriber.complete();
                  return;
                }

                try {
                  const event = JSON.parse(payload) as SSEEvent;
                  subscriber.next(event);
                  if (event.type === 'done') {
                    subscriber.complete();
                    return;
                  }
                  if (event.type === 'error') {
                    subscriber.error(new Error(String(event.data)));
                    return;
                  }
                } catch {
                  // Ignore malformed lines
                }
              }
            }
            subscriber.complete();
          } catch (err) {
            const error = err as Error;
            if (error.name !== 'AbortError') {
              subscriber.error(error);
            }
          }
        })
        .catch(err => {
          if ((err as Error).name !== 'AbortError') {
            subscriber.error(err);
          }
        })
        .finally(() => {
          this.isStreaming.set(false);
        });

      return () => {
        controller.abort();
        this.isStreaming.set(false);
      };
    });
  }
}
