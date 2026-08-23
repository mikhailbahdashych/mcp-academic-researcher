import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { PrismaService } from '../../common/database/prisma.service';
import { SettingsService } from './settings.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const STORED_KEY = 'sk-ant-abcdef1234';

type SettingRow = {
  id: string;
  llmProvider: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  anthropicModel: string;
  anthropicApiKey: string | null;
  updatedAt: Date;
};

const row = (overrides: Partial<SettingRow> = {}): SettingRow => ({
  id: 'default',
  llmProvider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:7b',
  anthropicModel: 'claude-opus-5',
  anthropicApiKey: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: { setting: { upsert: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = { setting: { upsert: jest.fn(), update: jest.fn() } };
    mockedAxios.get.mockResolvedValue({
      data: { anthropic_api_key_present: false },
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get<SettingsService>(SettingsService);
  });

  describe('get', () => {
    it('upserts the singleton row', async () => {
      prisma.setting.upsert.mockResolvedValue(row());

      await service.get();

      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { id: 'default' },
        update: {},
        create: { id: 'default' },
      });
    });

    it('masks the stored anthropic key and never returns it raw', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );

      const view = await service.get();

      expect(view.anthropicApiKeySet).toBe(true);
      expect(view.anthropicApiKeyHint).toBe('••••1234');
      expect(JSON.stringify(view)).not.toContain(STORED_KEY);
      expect(view.updatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(view.llmProvider).toBe('ollama');
      expect(view.ollamaBaseUrl).toBe('http://localhost:11434');
      expect(view.ollamaModel).toBe('qwen2.5:7b');
      expect(view.anthropicModel).toBe('claude-opus-5');
    });

    it('reports no stored key when the column is null', async () => {
      prisma.setting.upsert.mockResolvedValue(row());

      const view = await service.get();

      expect(view.anthropicApiKeySet).toBe(false);
      expect(view.anthropicApiKeyHint).toBeNull();
    });

    it('reports the orchestrator env key presence', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.get.mockResolvedValue({
        data: { anthropic_api_key_present: true },
      });

      const view = await service.get();

      expect(view.anthropicEnvKeyPresent).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/llm/env'),
        expect.objectContaining({ timeout: 2000 }),
      );
    });

    it('falls back to anthropicEnvKeyPresent=false when the orchestrator is down', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));

      const view = await service.get();

      expect(view.anthropicEnvKeyPresent).toBe(false);
    });
  });

  describe('update', () => {
    it('clears the key when an empty string is submitted', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      prisma.setting.update.mockResolvedValue(row({ anthropicApiKey: null }));

      await service.update({ anthropicApiKey: '' });

      expect(prisma.setting.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: { anthropicApiKey: null },
      });
    });

    it('stores a non-empty key verbatim (trimmed)', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      prisma.setting.update.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );

      await service.update({ anthropicApiKey: `  ${STORED_KEY}  ` });

      expect(prisma.setting.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: { anthropicApiKey: STORED_KEY },
      });
    });

    it('leaves the key untouched when it is not part of the payload', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );
      prisma.setting.update.mockResolvedValue(
        row({ ollamaModel: 'llama3', anthropicApiKey: STORED_KEY }),
      );

      const view = await service.update({ ollamaModel: 'llama3' });

      const { data } = prisma.setting.update.mock.calls[0][0];
      expect(data).toEqual({ ollamaModel: 'llama3' });
      expect(data).not.toHaveProperty('anthropicApiKey');
      expect(view.ollamaModel).toBe('llama3');
      expect(JSON.stringify(view)).not.toContain(STORED_KEY);
    });

    it('persists provider and url changes', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      prisma.setting.update.mockResolvedValue(
        row({ llmProvider: 'anthropic', ollamaBaseUrl: 'http://ollama:11434' }),
      );

      await service.update({
        llmProvider: 'anthropic',
        ollamaBaseUrl: 'http://ollama:11434',
      });

      expect(prisma.setting.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: {
          llmProvider: 'anthropic',
          ollamaBaseUrl: 'http://ollama:11434',
        },
      });
    });
  });

  describe('getLlmConfig', () => {
    it('returns the ollama config', async () => {
      prisma.setting.upsert.mockResolvedValue(row());

      await expect(service.getLlmConfig()).resolves.toEqual({
        provider: 'ollama',
        model: 'qwen2.5:7b',
        api_key: null,
        base_url: 'http://localhost:11434',
      });
    });

    it('returns the anthropic config with the stored key', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ llmProvider: 'anthropic', anthropicApiKey: STORED_KEY }),
      );

      await expect(service.getLlmConfig()).resolves.toEqual({
        provider: 'anthropic',
        model: 'claude-opus-5',
        api_key: STORED_KEY,
        base_url: null,
      });
    });

    it('sends api_key null for anthropic when nothing is stored', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ llmProvider: 'anthropic' }),
      );

      await expect(service.getLlmConfig()).resolves.toEqual({
        provider: 'anthropic',
        model: 'claude-opus-5',
        api_key: null,
        base_url: null,
      });
    });
  });

  describe('listModels', () => {
    it('falls back to the stored key when apiKey is omitted for anthropic', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );
      mockedAxios.post.mockResolvedValue({
        data: { models: [{ id: 'claude-opus-5', name: 'Claude Opus 5' }] },
      });

      const result = await service.listModels({ provider: 'anthropic' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/llm/models'),
        {
          provider: 'anthropic',
          model: null,
          api_key: STORED_KEY,
          base_url: null,
        },
        expect.any(Object),
      );
      expect(result).toEqual({
        models: [{ id: 'claude-opus-5', name: 'Claude Opus 5' }],
      });
    });

    it('falls back to the stored base url for ollama and prefers submitted values', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.post.mockResolvedValue({ data: { models: [] } });

      await service.listModels({ provider: 'ollama' });
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/llm/models'),
        {
          provider: 'ollama',
          model: null,
          api_key: null,
          base_url: 'http://localhost:11434',
        },
        expect.any(Object),
      );

      await service.listModels({
        provider: 'ollama',
        baseUrl: 'http://remote:11434',
        model: 'llama3',
      });
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/llm/models'),
        {
          provider: 'ollama',
          model: 'llama3',
          api_key: null,
          base_url: 'http://remote:11434',
        },
        expect.any(Object),
      );
    });

    it('passes through an orchestrator-reported provider error', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.post.mockResolvedValue({
        data: { models: [], error: 'ollama not reachable' },
      });

      await expect(service.listModels({ provider: 'ollama' })).resolves.toEqual(
        { models: [], error: 'ollama not reachable' },
      );
    });

    it('never throws when the orchestrator is unreachable', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );
      mockedAxios.post.mockRejectedValue(new Error('connect ECONNREFUSED'));

      const result = await service.listModels({ provider: 'anthropic' });

      expect(result).toEqual({ models: [], error: 'Orchestrator unreachable' });
      expect(JSON.stringify(result)).not.toContain(STORED_KEY);
    });
  });

  describe('test', () => {
    it('maps latency_ms to latencyMs', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.post.mockResolvedValue({
        data: { ok: true, model: 'qwen2.5:7b', latency_ms: 123, reply: 'pong' },
      });

      await expect(service.test({ provider: 'ollama' })).resolves.toEqual({
        ok: true,
        model: 'qwen2.5:7b',
        latencyMs: 123,
        reply: 'pong',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/llm/test'),
        expect.objectContaining({ provider: 'ollama' }),
        expect.any(Object),
      );
    });

    it('returns the orchestrator failure verbatim', async () => {
      prisma.setting.upsert.mockResolvedValue(row());
      mockedAxios.post.mockResolvedValue({
        data: { ok: false, error: 'invalid x-api-key' },
      });

      await expect(service.test({ provider: 'anthropic' })).resolves.toEqual({
        ok: false,
        error: 'invalid x-api-key',
      });
    });

    it('never throws when the orchestrator is unreachable', async () => {
      prisma.setting.upsert.mockResolvedValue(
        row({ anthropicApiKey: STORED_KEY }),
      );
      mockedAxios.post.mockRejectedValue(new Error('connect ECONNREFUSED'));

      const result = await service.test({ provider: 'anthropic' });

      expect(result).toEqual({ ok: false, error: 'Orchestrator unreachable' });
      expect(JSON.stringify(result)).not.toContain(STORED_KEY);
    });
  });
});
