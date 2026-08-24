import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { SettingsView } from '@api-types/settings.types';

const VIEW: SettingsView = {
  llmProvider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:7b',
  anthropicModel: 'claude-opus-5',
  anthropicApiKeySet: false,
  anthropicApiKeyHint: null,
  anthropicEnvKeyPresent: true,
  updatedAt: '2026-08-23T21:33:38.414Z',
};

describe('SettingsService', () => {
  let service: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // Constructing the service fires load(), so grab both up front.
    service = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads settings from GET /api/settings on construction', () => {
    const req = http.expectOne('/api/settings');
    expect(req.request.method).toBe('GET');
    expect(service.loading()).toBeTrue();

    req.flush(VIEW);

    expect(service.settings()).toEqual(VIEW);
    expect(service.loading()).toBeFalse();
    expect(service.currentProvider()).toBe('ollama');
    expect(service.currentModelLabel()).toBe('qwen2.5:7b');
  });

  it('keeps settings null and falls back to defaults when the load fails', () => {
    http.expectOne('/api/settings').error(new ProgressEvent('network'));

    expect(service.settings()).toBeNull();
    expect(service.loading()).toBeFalse();
    expect(service.currentProvider()).toBe('ollama');
    expect(service.currentModelLabel()).toBe('qwen2.5:7b');
  });

  it('reports the anthropic model as the current label for that provider', () => {
    http.expectOne('/api/settings').flush({ ...VIEW, llmProvider: 'anthropic' });

    expect(service.currentProvider()).toBe('anthropic');
    expect(service.currentModelLabel()).toBe('claude-opus-5');
  });

  it('PUTs the update and adopts the returned view', () => {
    http.expectOne('/api/settings').flush(VIEW);

    const updated = { ...VIEW, llmProvider: 'anthropic' as const };
    service.save({ llmProvider: 'anthropic' }).subscribe();

    const req = http.expectOne('/api/settings');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ llmProvider: 'anthropic' });
    req.flush(updated);

    expect(service.settings()).toEqual(updated);
    expect(service.currentModelLabel()).toBe('claude-opus-5');
  });

  it('strips blank optional fields from a models probe', () => {
    http.expectOne('/api/settings').flush(VIEW);

    service.listModels({ provider: 'anthropic', apiKey: '  ' }).subscribe();

    const req = http.expectOne('/api/settings/models');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ provider: 'anthropic' });
    expect('apiKey' in (req.request.body as object)).toBeFalse();
    req.flush({ models: [] });
  });

  it('keeps trimmed non-blank probe fields', () => {
    http.expectOne('/api/settings').flush(VIEW);

    service
      .test({ provider: 'ollama', baseUrl: ' http://localhost:11434 ', model: 'qwen2.5:7b' })
      .subscribe();

    const req = http.expectOne('/api/settings/test');
    expect(req.request.body).toEqual({
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b',
    });
    req.flush({ ok: true, model: 'qwen2.5:7b', latencyMs: 12 });
  });
});
