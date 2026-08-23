import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { Response } from 'express';
import { PrismaService } from '../../common/database/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SettingsService } from '../settings/settings.service';
import { ChatService } from './chat.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const OLLAMA_CONFIG = {
  provider: 'ollama' as const,
  model: 'qwen2.5:7b',
  api_key: null,
  base_url: 'http://localhost:11434',
};

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    message: { create: jest.Mock; update: jest.Mock };
    conversation: { update: jest.Mock };
  };
  let settings: { getLlmConfig: jest.Mock };
  let res: Response;

  /** An orchestrator stream that emits one token event and then ends. */
  const stubOrchestratorStream = (tokens: string[] = ['hello']) => {
    const stream = new EventEmitter();
    mockedAxios.post.mockResolvedValue({ data: stream });
    setTimeout(() => {
      for (const token of tokens) {
        stream.emit(
          'data',
          Buffer.from(
            `data: ${JSON.stringify({ type: 'token', data: token })}\n\n`,
          ),
        );
      }
      stream.emit('end');
    }, 0);
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      message: {
        create: jest.fn().mockResolvedValue({ id: 'assistant-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      conversation: { update: jest.fn().mockResolvedValue({}) },
    };
    settings = { getLlmConfig: jest.fn().mockResolvedValue(OLLAMA_CONFIG) };
    res = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConversationsService,
          useValue: { findOne: jest.fn().mockResolvedValue({ messages: [] }) },
        },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = moduleRef.get<ChatService>(ChatService);
  });

  it('forwards the llm config and the selected sources to the orchestrator', async () => {
    stubOrchestratorStream();

    await service.streamChat('conv-1', 'what is attention?', res, undefined, [
      'arxiv',
    ]);

    expect(settings.getLlmConfig).toHaveBeenCalled();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      {
        conversation_id: 'conv-1',
        message: 'what is attention?',
        history: [],
        force_tool: null,
        sources: ['arxiv'],
        llm: OLLAMA_CONFIG,
      },
      expect.objectContaining({ responseType: 'stream' }),
    );
  });

  it('sends null for force_tool and sources when neither is requested', async () => {
    stubOrchestratorStream();

    await service.streamChat('conv-1', 'hi', res);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ force_tool: null, sources: null }),
      expect.anything(),
    );
  });

  it('surfaces a settings-read failure before opening the SSE stream', async () => {
    settings.getLlmConfig.mockRejectedValue(new Error('db is down'));

    await expect(service.streamChat('conv-1', 'hi', res)).rejects.toThrow(
      'db is down',
    );
    // Nothing persisted, no headers flushed, no mock-stream masquerade: the
    // caller still gets a normal error response.
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('persists the accumulated assistant content', async () => {
    stubOrchestratorStream(['Attention ', 'is all you need.']);

    await service.streamChat('conv-1', 'hi', res);

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 'assistant-1' },
      data: { content: 'Attention is all you need.', papers: null },
    });
    expect(res.end).toHaveBeenCalled();
  });
});
