import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Body of `POST /api/notes` — proxied to the orchestrator's `POST /notes`. */
export class CreateNoteDto {
  /** Note title (shown as the card heading). */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Full note body text. */
  @IsString()
  @IsNotEmpty()
  content!: string;

  /** Comma-separated paper IDs the note refers to. */
  @IsOptional()
  @IsString()
  paper_id?: string | null;

  /** Tag strings for categorization. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
