import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Credentials to probe a provider with, before they are ever saved.
 *
 * Omitted fields fall back to what is stored (and, for the Anthropic key,
 * ultimately to the orchestrator's own environment).
 */
export class ProviderProbeDto {
  @IsIn(['ollama', 'anthropic'])
  provider: 'ollama' | 'anthropic';

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;
}
