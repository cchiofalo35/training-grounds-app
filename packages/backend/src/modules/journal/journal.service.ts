import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { JournalCommentEntity } from '../../entities/journal-comment.entity';
import { CreateJournalDto } from './dto/create-journal.dto';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalCommentEntity)
    private readonly commentRepo: Repository<JournalCommentEntity>,
  ) {}

  async create(gymId: string, userId: string, dto: CreateJournalDto): Promise<JournalEntryEntity> {
    const entry = this.journalRepo.create({
      gymId,
      userId,
      attendanceId: dto.attendanceId ?? null,
      className: dto.className ?? null,
      discipline: (dto.discipline as any) ?? null,
      exploration: dto.exploration,
      challenge: dto.challenge,
      worked: dto.worked,
      takeaways: dto.takeaways,
      nextSession: dto.nextSession,
      isSharedWithCoach: dto.isSharedWithCoach ?? false,
    });
    return this.journalRepo.save(entry);
  }

  async findAll(gymId: string, userId: string): Promise<JournalEntryEntity[]> {
    return this.journalRepo.find({
      where: { gymId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(gymId: string, userId: string, id: string): Promise<JournalEntryEntity> {
    const entry = await this.journalRepo.findOne({ where: { id, gymId, userId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async update(gymId: string, userId: string, id: string, dto: Partial<CreateJournalDto>): Promise<JournalEntryEntity> {
    const entry = await this.findOne(gymId, userId, id);
    Object.assign(entry, dto);
    return this.journalRepo.save(entry);
  }

  async remove(gymId: string, userId: string, id: string): Promise<void> {
    const entry = await this.findOne(gymId, userId, id);
    await this.journalRepo.remove(entry);
  }

  async getComments(gymId: string, userId: string, entryId: string): Promise<any[]> {
    // Verify the entry belongs to this user and gym
    await this.findOne(gymId, userId, entryId);

    const comments = await this.commentRepo.find({
      where: { gymId, journalEntryId: entryId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      authorName: c.author?.name ?? 'Coach',
      authorRole: c.author?.role ?? 'coach',
      content: c.content,
      createdAt: c.createdAt,
    }));
  }
}
