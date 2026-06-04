import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementEntity } from '../../entities/announcement.entity';

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  isActive?: boolean;
  expiresAt?: string | null;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly repo: Repository<AnnouncementEntity>,
  ) {}

  async create(gymId: string, input: CreateAnnouncementInput): Promise<AnnouncementEntity> {
    const a = this.repo.create({
      gymId,
      title: input.title,
      body: input.body,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: input.createdBy ?? null,
      createdByName: input.createdByName ?? null,
      isActive: true,
    });
    return this.repo.save(a);
  }

  async findAll(gymId: string): Promise<AnnouncementEntity[]> {
    return this.repo.find({ where: { gymId }, order: { createdAt: 'DESC' } });
  }

  /** Active, non-expired announcements for a gym — newest first. */
  async getActive(gymId: string): Promise<AnnouncementEntity[]> {
    const now = new Date();
    const rows = await this.repo.find({
      where: { gymId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return rows.filter((a) => !a.expiresAt || a.expiresAt > now);
  }

  async update(
    gymId: string,
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<AnnouncementEntity> {
    const a = await this.repo.findOne({ where: { id, gymId } });
    if (!a) throw new NotFoundException('Announcement not found');
    if (input.title !== undefined) a.title = input.title;
    if (input.body !== undefined) a.body = input.body;
    if (input.isActive !== undefined) a.isActive = input.isActive;
    if (input.expiresAt !== undefined) {
      a.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }
    return this.repo.save(a);
  }

  async remove(gymId: string, id: string): Promise<void> {
    const a = await this.repo.findOne({ where: { id, gymId } });
    if (!a) throw new NotFoundException('Announcement not found');
    await this.repo.remove(a);
  }
}
