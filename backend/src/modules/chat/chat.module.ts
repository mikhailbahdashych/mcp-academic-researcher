import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ConversationsModule, SettingsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
