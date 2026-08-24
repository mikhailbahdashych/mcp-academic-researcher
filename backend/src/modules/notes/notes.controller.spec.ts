import { Test, TestingModule } from '@nestjs/testing';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  let service: { createNote: jest.Mock };

  beforeEach(async () => {
    service = { createNote: jest.fn().mockResolvedValue({ id: 'n1' }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: service }],
    }).compile();

    controller = module.get<NotesController>(NotesController);
  });

  describe('createNote', () => {
    it('forwards the DTO to the service and returns its result', async () => {
      const dto: CreateNoteDto = {
        title: 'Attention is all you need',
        content: 'Transformers replace recurrence with self-attention.',
        paper_id: '1706.03762',
        tags: ['transformers'],
      };

      await expect(controller.createNote(dto)).resolves.toEqual({ id: 'n1' });
      expect(service.createNote).toHaveBeenCalledTimes(1);
      expect(service.createNote).toHaveBeenCalledWith(dto);
    });
  });
});
