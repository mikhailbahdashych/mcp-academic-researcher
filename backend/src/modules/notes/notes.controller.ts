import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
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
    return this.notesService.getNotes(
      paperId,
      tags,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('search')
  searchNotes(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.notesService.searchNotes(q, limit ? Number(limit) : undefined);
  }

  @Post()
  createNote(@Body() dto: CreateNoteDto) {
    return this.notesService.createNote(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }
}
