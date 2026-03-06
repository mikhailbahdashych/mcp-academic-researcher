import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { StreamChatDto } from './dto/stream-chat.dto';

@Controller('conversations')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post(':id/messages/stream')
  stream(
    @Param('id') id: string,
    @Body() dto: StreamChatDto,
    @Res() res: Response,
  ) {
    return this.service.streamChat(id, dto.query, res);
  }
}
