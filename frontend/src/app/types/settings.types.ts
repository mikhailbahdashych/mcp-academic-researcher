/**
 * Shapes of the LLM-provider settings JSON exchanged with the NestJS backend
 * under /api/settings.
 *
 * The Anthropic API key is write-only: it is sent up in `UpdateSettingsInput`
 * and `ProviderProbeInput`, but never comes back down — `SettingsView` carries
 * only a boolean and a masked "••••1234" hint.
 */

/** The LLM backend the orchestrator talks to. */
export type ProviderId = 'ollama' | 'anthropic';

/**
 * Current settings as returned by `GET /api/settings` and `PUT /api/settings`.
 * Every field is always present; only the key hint may be null.
 */
export interface SettingsView {
  /** Provider used for chat completions. */
  llmProvider: ProviderId;
  /** Base URL of the Ollama server, e.g. `http://localhost:11434`. */
  ollamaBaseUrl: string;
  /** Ollama model tag, e.g. `qwen2.5:7b`. */
  ollamaModel: string;
  /** Anthropic model id, e.g. `claude-opus-5`. */
  anthropicModel: string;
  /** True when an API key is stored in the backend database. */
  anthropicApiKeySet: boolean;
  /** Masked last-4 hint (`••••1234`) when a key is stored, else null. */
  anthropicApiKeyHint: string | null;
  /** True when the orchestrator's environment provides a fallback key. */
  anthropicEnvKeyPresent: boolean;
  /** ISO 8601 timestamp of the last save. */
  updatedAt: string;
}

/**
 * Partial update sent to `PUT /api/settings`.
 *
 * Omitted fields stay unchanged. Blank models and URLs are ignored by the
 * backend, but `anthropicApiKey: ''` deliberately CLEARS the stored key.
 */
export interface UpdateSettingsInput {
  llmProvider?: ProviderId;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  anthropicModel?: string;
  /** New key, or `''` to remove the stored one. Omit to leave it alone. */
  anthropicApiKey?: string;
}

/**
 * Credentials to probe a provider with before they are saved, for
 * `POST /api/settings/models` and `POST /api/settings/test`.
 *
 * Optional fields fall back to the stored settings server-side, so blank
 * values must be omitted rather than sent as empty strings.
 */
export interface ProviderProbeInput {
  provider: ProviderId;
  /** Ollama base URL to probe. Must be a full URL when present. */
  baseUrl?: string;
  /** Unsaved API key typed by the user. */
  apiKey?: string;
  /** Model to test against; ignored by the models endpoint. */
  model?: string;
}

/** One entry of a provider's model list. */
export interface ModelOption {
  id: string;
  name: string;
}

/**
 * Result of `POST /api/settings/models`. Always HTTP 200 — a failed probe
 * comes back as an empty list plus an `error` message.
 */
export interface ModelsResult {
  models: ModelOption[];
  error?: string;
}

/**
 * Result of `POST /api/settings/test`. Always HTTP 200 — `ok: false` plus an
 * `error` message describes a failed round-trip.
 */
export interface ProbeResult {
  ok: boolean;
  /** Model that answered the test prompt. */
  model?: string;
  /** Round-trip latency in milliseconds. */
  latencyMs?: number;
  /** First few characters of the model's reply. */
  reply?: string;
  /** Failure reason when `ok` is false. */
  error?: string;
}
