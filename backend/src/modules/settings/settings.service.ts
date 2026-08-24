import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../common/database/prisma.service';
import { ProviderProbeDto } from './dto/provider-probe.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export type LlmProvider = 'ollama' | 'anthropic';

/** Settings as the browser sees them: the API key is masked, never returned. */
export interface SettingsView {
  llmProvider: LlmProvider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  anthropicModel: string;
  anthropicApiKeySet: boolean;
  anthropicApiKeyHint: string | null;
  anthropicEnvKeyPresent: boolean;
  updatedAt: string;
}

/** The `llm` block the orchestrator's /chat and /llm endpoints expect. */
export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  api_key: string | null;
  base_url: string | null;
}

export interface ModelOption {
  id: string;
  name: string;
}

export interface ModelsResult {
  models: ModelOption[];
  error?: string;
}

export interface ProviderTestResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  reply?: string;
  error?: string;
}

interface SettingRow {
  id: string;
  llmProvider: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  anthropicModel: string;
  anthropicApiKey: string | null;
  updatedAt: Date;
}

/** Payload sent to the orchestrator's probe endpoints. Mirrors `LLMConfig`. */
interface ProbePayload {
  provider: LlmProvider;
  model: string | null;
  api_key: string | null;
  base_url: string | null;
}

const SINGLETON_ID = 'default';
const UNREACHABLE = 'Orchestrator unreachable';

/** Trimmed value, or undefined when the field was omitted or all whitespace. */
function blank(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly orchestratorUrl =
    process.env.ORCHESTRATOR_URL ?? 'http://localhost:8000';

  constructor(private readonly prisma: PrismaService) {}

  /** Current settings, with the stored key reduced to a "••••1234" hint. */
  async get(): Promise<SettingsView> {
    const row = await this.load();
    return this.toView(row, await this.fetchEnvKeyPresent());
  }

  /**
   * Apply a partial update. Omitted fields stay as they are; an empty
   * `anthropicApiKey` clears the stored key.
   */
  async update(dto: UpdateSettingsDto): Promise<SettingsView> {
    await this.load();

    const data: Partial<Omit<SettingRow, 'id' | 'updatedAt'>> = {};
    if (dto.llmProvider !== undefined) data.llmProvider = dto.llmProvider;

    // A blank value means "leave it alone", never "store an empty string": an
    // empty model or base url would break every subsequent chat.
    const baseUrl = blank(dto.ollamaBaseUrl);
    if (baseUrl) data.ollamaBaseUrl = baseUrl;
    const ollamaModel = blank(dto.ollamaModel);
    if (ollamaModel) data.ollamaModel = ollamaModel;
    const anthropicModel = blank(dto.anthropicModel);
    if (anthropicModel) data.anthropicModel = anthropicModel;

    // The key is the exception: an empty string is how the UI clears it.
    if (dto.anthropicApiKey !== undefined) {
      const key = dto.anthropicApiKey.trim();
      data.anthropicApiKey = key === '' ? null : key;
    }

    const row = (await this.prisma.setting.update({
      where: { id: SINGLETON_ID },
      data,
    })) as SettingRow;

    return this.toView(row, await this.fetchEnvKeyPresent());
  }

  /** The provider block ChatService forwards with every orchestrator call. */
  async getLlmConfig(): Promise<LlmConfig> {
    const row = await this.load();

    if (row.llmProvider === 'anthropic') {
      return {
        provider: 'anthropic',
        model: row.anthropicModel,
        api_key: row.anthropicApiKey ?? null,
        base_url: null,
      };
    }

    return {
      provider: 'ollama',
      model: row.ollamaModel,
      api_key: null,
      base_url: row.ollamaBaseUrl,
    };
  }

  /**
   * Ask the orchestrator which models the provider offers. A provider that is
   * unconfigured or unreachable is a result, not a 500: this always resolves.
   */
  async listModels(dto: ProviderProbeDto): Promise<ModelsResult> {
    const payload = await this.toProbePayload(dto);

    try {
      const res = await axios.post(
        `${this.orchestratorUrl}/llm/models`,
        payload,
        { timeout: 15000 },
      );
      const models: ModelOption[] = res.data?.models ?? [];
      const error: string | undefined = res.data?.error;
      return error ? { models, error } : { models };
    } catch (err: unknown) {
      // Message only: the payload carries the API key.
      this.logger.warn(
        `Listing models failed for provider ${payload.provider}: ${(err as Error).message}`,
      );
      return { models: [], error: UNREACHABLE };
    }
  }

  /** Round-trip one tiny completion through the provider. Always resolves. */
  async test(dto: ProviderProbeDto): Promise<ProviderTestResult> {
    const payload = await this.toProbePayload(dto);

    try {
      const res = await axios.post(
        `${this.orchestratorUrl}/llm/test`,
        payload,
        {
          timeout: 30000,
        },
      );
      const body = res.data ?? {};
      if (!body.ok) {
        return { ok: false, error: body.error ?? 'Provider test failed' };
      }
      return {
        ok: true,
        model: body.model,
        latencyMs: body.latency_ms,
        reply: body.reply,
      };
    } catch (err: unknown) {
      // Message only: the payload carries the API key.
      this.logger.warn(
        `Provider test failed for provider ${payload.provider}: ${(err as Error).message}`,
      );
      return { ok: false, error: UNREACHABLE };
    }
  }

  /** Read the singleton row, creating it with schema defaults on first use. */
  private async load(): Promise<SettingRow> {
    return (await this.prisma.setting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    })) as SettingRow;
  }

  private toView(
    row: SettingRow,
    anthropicEnvKeyPresent: boolean,
  ): SettingsView {
    const key = row.anthropicApiKey;

    return {
      llmProvider: row.llmProvider === 'anthropic' ? 'anthropic' : 'ollama',
      ollamaBaseUrl: row.ollamaBaseUrl,
      ollamaModel: row.ollamaModel,
      anthropicModel: row.anthropicModel,
      anthropicApiKeySet: Boolean(key),
      // Hint only at a key long enough that its last 4 chars are not the whole
      // of it -- a short key would otherwise be echoed back verbatim.
      anthropicApiKeyHint:
        key && key.length > 4 ? `••••${key.slice(-4)}` : null,
      anthropicEnvKeyPresent,
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  /**
   * Whether the orchestrator itself holds an ANTHROPIC_API_KEY. Advisory only,
   * so an unreachable orchestrator answers "no" rather than failing the read.
   */
  private async fetchEnvKeyPresent(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.orchestratorUrl}/llm/env`, {
        timeout: 2000,
      });
      return Boolean(res.data?.anthropic_api_key_present);
    } catch (err: unknown) {
      this.logger.warn(
        `Could not read orchestrator LLM env status: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /** Submitted values win; anything omitted falls back to what is stored. */
  private async toProbePayload(dto: ProviderProbeDto): Promise<ProbePayload> {
    const row = await this.load();
    const provider = dto.provider;

    // A blank submitted field falls back to what is stored rather than shipping
    // an empty credential the provider would only reject.
    return {
      provider,
      model: blank(dto.model) ?? null,
      api_key:
        blank(dto.apiKey) ??
        (provider === 'anthropic' ? (row.anthropicApiKey ?? null) : null),
      base_url:
        blank(dto.baseUrl) ??
        (provider === 'ollama' ? row.ollamaBaseUrl : null),
    };
  }
}
