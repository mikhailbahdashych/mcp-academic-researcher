import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);
  private readonly orchestratorUrl =
    process.env.ORCHESTRATOR_URL ?? 'http://localhost:8000';

  async getNotes(
    paperId?: string,
    tags?: string,
    limit?: number,
  ): Promise<unknown[]> {
    const params: Record<string, string | number> = {};
    if (paperId) params['paper_id'] = paperId;
    if (tags) params['tags'] = tags;
    if (limit) params['limit'] = limit;

    const res = await axios.get(`${this.orchestratorUrl}/notes`, { params });
    return res.data;
  }

  async searchNotes(q: string, limit?: number): Promise<unknown[]> {
    const params: Record<string, string | number> = { q };
    if (limit) params['limit'] = limit;

    const res = await axios.get(`${this.orchestratorUrl}/notes/search`, {
      params,
    });
    return res.data;
  }

  async createNote(dto: CreateNoteDto): Promise<unknown> {
    try {
      const res = await axios.post(`${this.orchestratorUrl}/notes`, dto);
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 503) {
        this.logger.error('Orchestrator could not embed the note');
        throw new ServiceUnavailableException(
          'Note embedding service unavailable',
        );
      }
      throw err;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await axios.delete(`${this.orchestratorUrl}/notes/${id}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new NotFoundException(`Note ${id} not found`);
      }
      throw err;
    }
  }
}
