import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WritableSignal, computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { SettingsService } from '@core/services/settings.service';
import { ProviderId, SettingsView } from '@api-types/settings.types';

const OLLAMA_VIEW: SettingsView = {
  llmProvider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:7b',
  anthropicModel: 'claude-opus-5',
  anthropicApiKeySet: false,
  anthropicApiKeyHint: null,
  anthropicEnvKeyPresent: true,
  updatedAt: '2026-08-23T21:33:38.414Z',
};

/** Signal-backed stand-in for the real service, so the page never hits HTTP. */
function makeStub(view: SettingsView) {
  const settings: WritableSignal<SettingsView | null> = signal(view);
  return {
    settings,
    loading: signal(false),
    currentProvider: computed<ProviderId>(() => settings()?.llmProvider ?? 'ollama'),
    currentModelLabel: computed(() => settings()?.ollamaModel ?? 'qwen2.5:7b'),
    load: jasmine.createSpy('load'),
    save: jasmine.createSpy('save').and.returnValue(of(view)),
    listModels: jasmine
      .createSpy('listModels')
      .and.returnValue(of({ models: [{ id: 'qwen2.5:7b', name: 'qwen2.5:7b' }] })),
    test: jasmine
      .createSpy('test')
      .and.returnValue(of({ ok: true, model: 'qwen2.5:7b', latencyMs: 812 })),
  };
}

describe('SettingsComponent', () => {
  let stub: ReturnType<typeof makeStub>;

  async function create(view: SettingsView = OLLAMA_VIEW): Promise<{
    fixture: ComponentFixture<SettingsComponent>;
    el: HTMLElement;
  }> {
    stub = makeStub(view);
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SettingsService, useValue: stub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders the Ollama section with the model select populated', async () => {
    const { el } = await create();

    expect(stub.listModels).toHaveBeenCalledWith({
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
    });

    const baseUrl = el.querySelector<HTMLInputElement>('#ollama-url');
    expect(baseUrl?.value).toBe('http://localhost:11434');

    const select = el.querySelector<HTMLSelectElement>('select#ollama-model');
    expect(select).toBeTruthy();
    const options = Array.from(select!.options).map(o => o.value);
    expect(options).toContain('qwen2.5:7b');
    expect(select!.value).toBe('qwen2.5:7b');
    expect(el.querySelector('#anthropic-key')).toBeNull();
  });

  it('shows the API key input after clicking the Anthropic card', async () => {
    const { fixture, el } = await create();

    const cards = el.querySelectorAll<HTMLButtonElement>('.provider-card');
    expect(cards.length).toBe(2);
    cards[1].click();
    fixture.detectChanges();

    const key = el.querySelector<HTMLInputElement>('#anthropic-key');
    expect(key).toBeTruthy();
    expect(key!.type).toBe('password');
    expect(cards[1].getAttribute('aria-checked')).toBe('true');
    expect(cards[0].getAttribute('aria-checked')).toBe('false');
  });

  it('mentions the environment key when no key is stored', async () => {
    const { fixture, el } = await create();

    el.querySelectorAll<HTMLButtonElement>('.provider-card')[1].click();
    fixture.detectChanges();

    expect(el.querySelector('.key-status')?.textContent).toContain(
      'from the server environment',
    );
  });

  it('shows the masked hint and a clear action when a key is stored', async () => {
    const { fixture, el } = await create({
      ...OLLAMA_VIEW,
      llmProvider: 'anthropic',
      anthropicApiKeySet: true,
      anthropicApiKeyHint: '••••1234',
    });

    const status = el.querySelector('.key-status');
    expect(status?.textContent).toContain('••••1234');

    status!.querySelector<HTMLButtonElement>('.clear-key')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.key-status')?.textContent).toContain(
      'Key will be removed on save',
    );
    expect(fixture.componentInstance.buildPayload().anthropicApiKey).toBe('');
  });

  it('omits anthropicApiKey from the save payload when none was typed', async () => {
    const { fixture, el } = await create();

    el.querySelector<HTMLButtonElement>('.pill-btn')!.click();

    expect(stub.save).toHaveBeenCalledTimes(1);
    const payload = stub.save.calls.mostRecent().args[0] as Record<string, unknown>;
    expect(payload).toEqual({
      llmProvider: 'ollama',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen2.5:7b',
      anthropicModel: 'claude-opus-5',
    });
    expect('anthropicApiKey' in payload).toBeFalse();
    expect(fixture.componentInstance.buildPayload().anthropicApiKey).toBeUndefined();
  });

  it('renders the test result as a mono status line', async () => {
    const { fixture, el } = await create();

    const actions = Array.from(el.querySelectorAll<HTMLButtonElement>('.footer .icon-action'));
    actions.find(b => b.textContent?.includes('Test connection'))!.click();
    fixture.detectChanges();

    expect(stub.test).toHaveBeenCalledWith({
      provider: 'ollama',
      model: 'qwen2.5:7b',
      baseUrl: 'http://localhost:11434',
      apiKey: undefined,
    });
    const status = el.querySelector('.footer .status');
    expect(status?.textContent).toContain('qwen2.5:7b');
    expect(status?.textContent).toContain('812 ms');
  });
});
