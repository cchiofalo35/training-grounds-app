import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('journal')
@UseGuards(AuthGuard('jwt'))
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateJournalDto) {
    const entry = await this.journalService.create(req.gymId, req.user.id, dto);
    return { success: true, data: entry };
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const entries = await this.journalService.findAll(req.gymId, req.user.id);
    return { success: true, data: entries };
  }

  @Get(':id')
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const entry = await this.journalService.findOne(req.gymId, req.user.id, id);
    return { success: true, data: entry };
  }

  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateJournalDto>,
  ) {
    const entry = await this.journalService.update(req.gymId, req.user.id, id, dto);
    return { success: true, data: entry };
  }

  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.journalService.remove(req.gymId, req.user.id, id);
    return { success: true, data: null };
  }

  @Get(':id/comments')
  async getComments(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const comments = await this.journalService.getComments(req.gymId, req.user.id, id);
    return { success: true, data: comments };
  }
}
