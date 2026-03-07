import { Controller, Delete, Get, HttpCode, Param, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  getNotes(
    @Query('paper_id') paperId?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notesService.getNotes(paperId, tags, limit ? Number(limit) : undefined);
  }

  @Get('search')
  searchNotes(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.notesService.searchNotes(q, limit ? Number(limit) : undefined);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }
}
