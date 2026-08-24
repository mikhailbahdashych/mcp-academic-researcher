import { Injectable, signal } from '@angular/core';

/** A paper source the composer can search. */
export type SearchSource = 'arxiv' | 'openalex';

const KEY = 'mcp_search_sources';
const ALL: SearchSource[] = ['arxiv', 'openalex'];

/**
 * Holds the set of paper sources the composer searches.
 *
 * Persisted to localStorage so the scope survives reloads. At least one source
 * is always enabled — toggling the last remaining source is a no-op.
 */
@Injectable({ providedIn: 'root' })
export class SearchScopeService {
  private readonly _sources = signal<SearchSource[]>(this.load());

  /** Currently enabled sources, always in canonical order and never empty. */
  readonly sources = this._sources.asReadonly();

  isEnabled(s: SearchSource): boolean {
    return this._sources().includes(s);
  }

  /** Enables or disables a source; ignored when it would clear the last one. */
  toggle(s: SearchSource): void {
    const cur = this._sources();
    const next = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s];
    if (!next.length) return;
    this._sources.set(ALL.filter(x => next.includes(x)));
    try {
      localStorage.setItem(KEY, JSON.stringify(this._sources()));
    } catch {
      /* ignore */
    }
  }

  private load(): SearchSource[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const valid = ALL.filter(x => parsed.includes(x));
        if (valid.length) return valid;
      }
    } catch {
      /* ignore */
    }
    return [...ALL];
  }
}
