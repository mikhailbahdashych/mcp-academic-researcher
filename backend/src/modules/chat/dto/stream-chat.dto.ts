import { IsNotEmpty, IsString } from 'class-validator';

export class StreamChatDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
