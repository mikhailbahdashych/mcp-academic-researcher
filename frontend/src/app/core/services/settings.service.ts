import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import {
  ModelsResult,
  ProbeResult,
  ProviderId,
  ProviderProbeInput,
  SettingsView,
  UpdateSettingsInput,
} from '@api-types/settings.types';

/** Shown by the composer chip until the real settings arrive. */
const FALLBACK_PROVIDER: ProviderId = 'ollama';
const FALLBACK_MODEL = 'qwen2.5:7b';

/**
 * Drops optional probe fields that are missing or all whitespace and trims
 * the rest.
 *
 * The backend DTO validates `baseUrl` as a URL, so an empty string is a 400
 * rather than "use the stored value"; a blank key would likewise override the
 * stored/environment key with nothing.
 */
export function pruneProbe(input: ProviderProbeInput): ProviderProbeInput {
  const pruned: ProviderProbeInput = { provider: input.provider };
  const baseUrl = input.baseUrl?.trim();
  if (baseUrl) pruned.baseUrl = baseUrl;
  const apiKey = input.apiKey?.trim();
  if (apiKey) pruned.apiKey = apiKey;
  const model = input.model?.trim();
  if (model) pruned.model = model;
  return pruned;
}

/**
 * Holds the LLM provider settings and talks to /api/settings.
 *
 * The settings are loaded once at startup so the composer's model chip can
 * render everywhere without each page fetching them again. A failed load
 * leaves `settings()` null and the chip on its defaults — the app still works,
 * because the backend resolves the provider server-side for every chat.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/settings';

  private readonly _settings = signal<SettingsView | null>(null);
  private readonly _loading = signal(false);

  /** Latest settings from the backend, or null before the first load lands. */
  readonly settings = this._settings.asReadonly();

  /** True while a load is in flight. */
  readonly loading = this._loading.asReadonly();

  /** Provider currently in use, defaulting to Ollama before the load lands. */
  readonly currentProvider = computed<ProviderId>(
    () => this._settings()?.llmProvider ?? FALLBACK_PROVIDER,
  );

  /** Model name for the active provider, for display in the composer chip. */
  readonly currentModelLabel = computed<string>(() => {
    const s = this._settings();
    if (!s) return FALLBACK_MODEL;
    return (s.llmProvider === 'anthropic' ? s.anthropicModel : s.ollamaModel) || FALLBACK_MODEL;
  });

  constructor() {
    this.load();
  }

  /** Refreshes the cached settings. Errors are swallowed: the chip falls back. */
  load(): void {
    this._loading.set(true);
    this.http
      .get<SettingsView>(this.BASE)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe(view => {
        if (view) this._settings.set(view);
      });
  }

  /**
   * Saves a partial update and adopts the returned view.
   * @param input - Only the fields to change; see `UpdateSettingsInput`.
   */
  save(input: UpdateSettingsInput): Observable<SettingsView> {
    return this.http
      .put<SettingsView>(this.BASE, input)
      .pipe(tap(view => this._settings.set(view)));
  }

  /** Lists the models a provider offers. Never errors on a bad probe (HTTP 200). */
  listModels(input: ProviderProbeInput): Observable<ModelsResult> {
    return this.http.post<ModelsResult>(`${this.BASE}/models`, pruneProbe(input));
  }

  /** Sends a one-token prompt to check the provider answers. HTTP 200 either way. */
  test(input: ProviderProbeInput): Observable<ProbeResult> {
    return this.http.post<ProbeResult>(`${this.BASE}/test`, pruneProbe(input));
  }
}
