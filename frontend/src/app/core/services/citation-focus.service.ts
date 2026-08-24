import { Injectable, Signal, signal } from '@angular/core';

/**
 * Bridges a citation chip click in the answer thread to the sources rail.
 *
 * There are two ways to name the source to reveal:
 *
 * - `focusPaper()` publishes a paper id. This is the accurate one: the model
 *   numbers its `[n]` markers against its own source list for that turn, so
 *   only the clicking message can say which paper a number means.
 * - `focus()` publishes a 1-based position in the session-wide list. It is the
 *   fallback for older threads whose messages carry no source list.
 *
 * Either way `tick` is bumped so that clicking the same chip twice still
 * re-triggers the rail's scroll and highlight effect.
 */
@Injectable({ providedIn: 'root' })
export class CitationFocusService {
  private readonly _focusedIndex = signal<number | null>(null);
  private readonly _focusedPaperId = signal<string | null>(null);
  private readonly _tick = signal(0);

  /** 1-based index of the source last requested positionally, if any. */
  readonly focusedIndex: Signal<number | null> = this._focusedIndex.asReadonly();

  /** Id of the source last requested by id, if any. Takes precedence. */
  readonly focusedPaperId: Signal<string | null> = this._focusedPaperId.asReadonly();

  /** Increments on every focus call, including repeats of the same source. */
  readonly tick: Signal<number> = this._tick.asReadonly();

  /** Reveals the source with this id, wherever the rail happens to list it. */
  focusPaper(id: string): void {
    this._focusedPaperId.set(id);
    this._focusedIndex.set(null);
    this._tick.update(t => t + 1);
  }

  /** Reveals the nth source of the session — used when no id is known. */
  focus(index: number): void {
    this._focusedIndex.set(index);
    this._focusedPaperId.set(null);
    this._tick.update(t => t + 1);
  }
}
