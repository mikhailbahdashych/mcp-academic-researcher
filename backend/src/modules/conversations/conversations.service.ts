import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

const MESSAGE_ORDER = { orderBy: { createdAt: 'asc' as const } };

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.conversation.findMany({
      include: { messages: MESSAGE_ORDER },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: { ...(dto.id ? { id: dto.id } : {}), title: dto.title },
      include: { messages: MESSAGE_ORDER },
    });
  }

  async findOne(id: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: MESSAGE_ORDER },
    });
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);
    return conv;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.conversation.delete({ where: { id } });
  }
}
