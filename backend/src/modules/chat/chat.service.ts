import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { PrismaService } from '../../common/database/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly orchestratorUrl =
    process.env.ORCHESTRATOR_URL ?? 'http://localhost:8000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async streamChat(
    conversationId: string,
    query: string,
    res: Response,
    forceTool?: { name: string; args: Record<string, unknown> },
    sources?: string[],
  ) {
    const conversation =
      await this.conversationsService.findOne(conversationId);

    // Save user message
    await this.prisma.message.create({
      data: { conversationId, role: 'user', content: query },
    });

    // Create placeholder assistant message
    const assistantMsg = await this.prisma.message.create({
      data: { conversationId, role: 'assistant', content: '' },
    });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let accumulatedContent = '';
    let accumulatedPapers: string | null = null;

    try {
      const orchestratorRes = await axios.post(
        `${this.orchestratorUrl}/chat`,
        {
          conversation_id: conversationId,
          message: query,
          history,
          force_tool: forceTool ?? null,
          sources: sources ?? null,
        },
        { responseType: 'stream', timeout: 60000 },
      );

      await new Promise<void>((resolve, reject) => {
        orchestratorRes.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          res.write(text);

          // Accumulate content for DB save
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const event = JSON.parse(payload);
              if (event.type === 'token') accumulatedContent += event.data;
              if (event.type === 'papers')
                accumulatedPapers = JSON.stringify(event.data);
            } catch {
              // Ignore malformed lines
            }
          }
        });

        orchestratorRes.data.on('end', resolve);
        orchestratorRes.data.on('error', reject);
      });
    } catch (err) {
      this.logger.warn(
        `Orchestrator unreachable, using mock stream: ${(err as Error).message}`,
      );
      await this.sendMockStream(res, query);
      accumulatedContent = `[Mock response] You asked: "${query}". The Python Orchestrator is not running yet.`;
    }

    // Update assistant message with final content
    await this.prisma.message.update({
      where: { id: assistantMsg.id },
      data: { content: accumulatedContent, papers: accumulatedPapers },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.end();
  }

  private async sendMockStream(res: Response, query: string) {
    const tokens = [
      '[Mock response] ',
      'The Python Orchestrator is not running yet. ',
      `You asked: "${query}". `,
      'Start the orchestrator at port 8000 to get real responses.',
    ];

    for (const token of tokens) {
      res.write(`data: ${JSON.stringify({ type: 'token', data: token })}\n\n`);
      await new Promise((r) => setTimeout(r, 80));
    }

    res.write(`data: ${JSON.stringify({ type: 'done', data: null })}\n\n`);
    res.write('data: [DONE]\n\n');
  }
}
