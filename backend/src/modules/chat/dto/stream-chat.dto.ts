import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class StreamChatDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsObject()
  forceTool?: { name: string; args: Record<string, unknown> };

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['arxiv', 'openalex'], { each: true })
  sources?: string[];
}
