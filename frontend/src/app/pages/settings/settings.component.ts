import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '@core/services/settings.service';
import {
  ModelOption,
  ProbeResult,
  ProviderId,
  SettingsView,
  UpdateSettingsInput,
} from '@api-types/settings.types';

/** The two provider radio-cards, in tab order. */
const PROVIDERS: ReadonlyArray<{
  id: ProviderId;
  icon: string;
  title: string;
  sub: string;
}> = [
  { id: 'ollama', icon: 'memory', title: 'Ollama', sub: 'Local models via your Ollama server' },
  { id: 'anthropic', icon: 'auto_awesome', title: 'Anthropic', sub: 'Claude models via API key' },
];

/** Offered in the free-text fallback when the Anthropic model list can't load. */
const ANTHROPIC_SUGGESTIONS = [
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-fable-5',
  'claude-haiku-4-5',
];

/**
 * Settings page: pick the LLM provider, point it at a model, and check the
 * connection before saving.
 *
 * Form state lives in local signals hydrated from `SettingsService`; nothing
 * is written back until Save. The Anthropic key is write-only — the typed
 * value is sent up and then dropped, and the stored one is only ever seen as
 * the masked hint the backend returns.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChildren('providerCard') private providerCards!: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly providers = PROVIDERS;
  protected readonly anthropicSuggestions = ANTHROPIC_SUGGESTIONS;

  protected readonly settings = this.settingsService.settings;
  protected readonly loading = this.settingsService.loading;

  /* ── Form state ── */

  readonly provider = signal<ProviderId>('ollama');
  readonly ollamaBaseUrl = signal('');
  readonly ollamaModel = signal('');
  readonly anthropicModel = signal('');
  /** Key typed by the user. Empty means "leave the stored key alone". */
  readonly anthropicApiKey = signal('');
  /** Set by "Clear key": sends an empty key on save, removing the stored one. */
  readonly clearKey = signal(false);

  /* ── Model lists ── */

  readonly ollamaModels = signal<ModelOption[]>([]);
  readonly ollamaModelsLoading = signal(false);
  readonly ollamaModelsError = signal<string | null>(null);

  readonly anthropicModels = signal<ModelOption[]>([]);
  readonly anthropicModelsLoading = signal(false);
  readonly anthropicModelsError = signal<string | null>(null);

  /* ── Actions ── */

  readonly testing = signal(false);
  readonly testResult = signal<ProbeResult | null>(null);
  readonly saving = signal(false);

  /** The settings object the form was last filled from, to hydrate only once per view. */
  private hydratedFrom: SettingsView | null = null;
  /** Base URL the Ollama list was fetched with, so blur only refetches on a change. */
  private ollamaModelsFor: string | null = null;
  private anthropicModelsLoaded = false;

  constructor() {
    effect(
      () => {
        const view = this.settings();
        if (!view || view === this.hydratedFrom) return;
        this.hydratedFrom = view;
        this.hydrate(view);
      },
      { allowSignalWrites: true },
    );
  }

  /** A `<select>` is shown while the list loads and once it has entries. */
  protected readonly ollamaSelectMode = computed(
    () => this.ollamaModelsLoading() || this.ollamaModels().length > 0,
  );

  protected readonly anthropicSelectMode = computed(
    () => this.anthropicModelsLoading() || this.anthropicModels().length > 0,
  );

  /** The fetched models, plus the saved one when the server didn't list it. */
  protected readonly ollamaOptions = computed(() =>
    withCurrent(this.ollamaModels(), this.ollamaModel()),
  );

  protected readonly anthropicOptions = computed(() =>
    withCurrent(this.anthropicModels(), this.anthropicModel()),
  );

  /** Model the Test and Save actions apply to. */
  protected readonly selectedModel = computed(() =>
    this.provider() === 'anthropic' ? this.anthropicModel() : this.ollamaModel(),
  );

  /**
   * Whether a key is available to probe Anthropic with — typed here, stored in
   * the database, or present in the orchestrator's environment.
   */
  protected readonly hasAnthropicKey = computed(() => {
    if (this.anthropicApiKey().trim()) return true;
    const view = this.settings();
    if (!view) return false;
    if (view.anthropicApiKeySet && !this.clearKey()) return true;
    return view.anthropicEnvKeyPresent;
  });

  protected selectProvider(id: ProviderId): void {
    if (this.provider() === id) return;
    this.provider.set(id);
    this.testResult.set(null);
    this.ensureModels(id);
  }

  /** Arrow keys move between the radio-cards; Space/Enter select natively. */
  protected onProviderKeydown(event: KeyboardEvent, index: number): void {
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    if (!back && !forward) return;

    event.preventDefault();
    const next = (index + (forward ? 1 : -1) + this.providers.length) % this.providers.length;
    this.selectProvider(this.providers[next].id);
    this.providerCards?.get(next)?.nativeElement.focus();
  }

  /** Refetches the Ollama list when the base URL actually changed. */
  protected onBaseUrlBlur(): void {
    if (this.ollamaBaseUrl().trim() !== this.ollamaModelsFor) this.loadOllamaModels();
  }

  protected loadOllamaModels(): void {
    const baseUrl = this.ollamaBaseUrl().trim();
    this.ollamaModelsFor = baseUrl;
    this.ollamaModelsLoading.set(true);
    this.ollamaModelsError.set(null);

    this.settingsService.listModels({ provider: 'ollama', baseUrl }).subscribe({
      next: result => {
        this.ollamaModels.set(result.models ?? []);
        this.ollamaModelsError.set(result.error ?? null);
        this.ollamaModelsLoading.set(false);
      },
      error: () => {
        this.ollamaModels.set([]);
        this.ollamaModelsError.set('Could not reach the server');
        this.ollamaModelsLoading.set(false);
      },
    });
  }

  protected loadAnthropicModels(): void {
    this.anthropicModelsLoaded = true;
    this.anthropicModelsLoading.set(true);
    this.anthropicModelsError.set(null);

    this.settingsService
      .listModels({ provider: 'anthropic', apiKey: this.anthropicApiKey() })
      .subscribe({
        next: result => {
          this.anthropicModels.set(result.models ?? []);
          this.anthropicModelsError.set(result.error ?? null);
          this.anthropicModelsLoading.set(false);
        },
        error: () => {
          this.anthropicModels.set([]);
          this.anthropicModelsError.set('Could not reach the server');
          this.anthropicModelsLoading.set(false);
        },
      });
  }

  protected runTest(): void {
    this.testing.set(true);
    this.testResult.set(null);

    const provider = this.provider();
    this.settingsService
      .test({
        provider,
        model: this.selectedModel(),
        baseUrl: provider === 'ollama' ? this.ollamaBaseUrl() : undefined,
        apiKey: provider === 'anthropic' ? this.anthropicApiKey() : undefined,
      })
      .subscribe({
        next: result => {
          this.testResult.set(result);
          this.testing.set(false);
        },
        error: () => {
          this.testResult.set({ ok: false, error: 'Could not reach the server' });
          this.testing.set(false);
        },
      });
  }

  protected save(): void {
    this.saving.set(true);

    this.settingsService.save(this.buildPayload()).subscribe({
      next: () => {
        this.saving.set(false);
        this.anthropicApiKey.set('');
        this.clearKey.set(false);
        // The list may now resolve differently (new base URL, new key), so let
        // the next open refetch it rather than probing again right away.
        this.ollamaModelsFor = null;
        this.anthropicModelsLoaded = false;
        this.snackBar.open('Settings saved', '', { duration: 1800 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Could not save settings', '', { duration: 2400 });
      },
    });
  }

  /**
   * Only sends what the user actually set: blank models and URLs are left to
   * the stored values, and the key is sent only when typed (to replace it) or
   * when cleared (as `''`, which removes it).
   */
  buildPayload(): UpdateSettingsInput {
    const payload: UpdateSettingsInput = { llmProvider: this.provider() };

    const baseUrl = this.ollamaBaseUrl().trim();
    if (baseUrl) payload.ollamaBaseUrl = baseUrl;
    const ollamaModel = this.ollamaModel().trim();
    if (ollamaModel) payload.ollamaModel = ollamaModel;
    const anthropicModel = this.anthropicModel().trim();
    if (anthropicModel) payload.anthropicModel = anthropicModel;

    const key = this.anthropicApiKey().trim();
    if (key) payload.anthropicApiKey = key;
    else if (this.clearKey()) payload.anthropicApiKey = '';

    return payload;
  }

  protected retry(): void {
    this.settingsService.load();
  }

  private hydrate(view: SettingsView): void {
    this.provider.set(view.llmProvider);
    this.ollamaBaseUrl.set(view.ollamaBaseUrl);
    this.ollamaModel.set(view.ollamaModel);
    this.anthropicModel.set(view.anthropicModel);
    this.ensureModels(view.llmProvider);
  }

  /** Loads the list for a section the first time it is shown. */
  private ensureModels(provider: ProviderId): void {
    if (provider === 'ollama') {
      if (this.ollamaModelsFor === null && !this.ollamaModelsLoading()) this.loadOllamaModels();
      return;
    }
    if (!this.anthropicModelsLoaded && !this.anthropicModelsLoading() && this.hasAnthropicKey()) {
      this.loadAnthropicModels();
    }
  }
}

/** Keeps the saved model selectable even when the provider didn't list it. */
function withCurrent(models: ModelOption[], current: string): ModelOption[] {
  const id = current.trim();
  if (!id || models.some(m => m.id === id)) return models;
  return [{ id, name: id }, ...models];
}
