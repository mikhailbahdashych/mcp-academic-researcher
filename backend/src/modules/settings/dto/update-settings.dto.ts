import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Partial update of the singleton settings row.
 *
 * Every field is optional and omission means "leave unchanged". The one
 * special case is `anthropicApiKey`: an empty string clears the stored key,
 * any other value replaces it.
 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(['ollama', 'anthropic'])
  llmProvider?: 'ollama' | 'anthropic';

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  ollamaBaseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ollamaModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  anthropicModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  anthropicApiKey?: string;
}
