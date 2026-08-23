import { Injectable, Signal, signal } from '@angular/core';

/**
 * Bridges a citation chip click in the answer thread to the sources rail.
 *
 * `focus()` publishes the 1-based index of the source to reveal and bumps `tick`
 * so that clicking the same chip twice still re-triggers the rail's scroll and
 * highlight effect.
 */
@Injectable({ providedIn: 'root' })
export class CitationFocusService {
  private readonly _focusedIndex = signal<number | null>(null);
  private readonly _tick = signal(0);

  /** 1-based index of the source last requested by a citation chip. */
  readonly focusedIndex: Signal<number | null> = this._focusedIndex.asReadonly();

  /** Increments on every `focus()` call, including repeats of the same index. */
  readonly tick: Signal<number> = this._tick.asReadonly();

  focus(index: number): void {
    this._focusedIndex.set(index);
    this._tick.update(t => t + 1);
  }
}
