import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
