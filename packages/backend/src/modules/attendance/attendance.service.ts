import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { UserEntity } from '../../entities/user.entity';
import { GamificationService } from '../gamification/gamification.service';

interface CheckinDto {
  classId: string;
  className: string;
  discipline: Discipline;
  intensityRating?: TrainingIntensity;
}

export interface AttendanceStats {
  totalClasses: number;
  thisWeek: number;
  thisMonth: number;
  classesByDiscipline: Record<string, number>;
  averagePerWeek: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly gamificationService: GamificationService,
  ) {}

  async checkin(
    userId: string,
    dto: CheckinDto,
  ): Promise<AttendanceRecordEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent duplicate check-ins for the same class
    const existing = await this.attendanceRepo.findOne({
      where: { userId, classId: dto.classId },
    });

    if (existing) {
      throw new BadRequestException('Already checked in to this class');
    }

    // Calculate XP earned for this check-in
    const xpEarned = this.calculateCheckinXp(dto.intensityRating);

    const record = this.attendanceRepo.create({
      userId,
      classId: dto.classId,
      className: dto.className,
      discipline: dto.discipline,
      intensityRating: dto.intensityRating ?? null,
      xpEarned,
    });

    const savedRecord = await this.attendanceRepo.save(record);

    // Award XP and update streak via gamification service
    await this.gamificationService.awardXp(userId, xpEarned, 'checkin');
    await this.gamificationService.updateStreak(userId);

    return savedRecord;
  }

  async getHistory(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<{ records: AttendanceRecordEntity[]; total: number }> {
    const [records, total] = await this.attendanceRepo.findAndCount({
      where: { userId },
      order: { checkedInAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { records, total };
  }

  async getStats(userId: string): Promise<AttendanceStats> {
    const totalClasses = await this.attendanceRepo.count({
      where: { userId },
    });

    const now = new Date();

    // This week (Monday-Sunday)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeek = await this.attendanceRepo.count({
      where: {
        userId,
        checkedInAt: Between(startOfWeek, now),
      },
    });

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = await this.attendanceRepo.count({
      where: {
        userId,
        checkedInAt: Between(startOfMonth, now),
      },
    });

    // Discipline breakdown
    const disciplineBreakdown = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.discipline', 'discipline')
      .addSelect('COUNT(*)', 'count')
      .where('a.userId = :userId', { userId })
      .groupBy('a.discipline')
      .getRawMany<{ discipline: string; count: string }>();

    const classesByDiscipline: Record<string, number> = {};
    for (const row of disciplineBreakdown) {
      classesByDiscipline[row.discipline] = parseInt(row.count, 10);
    }

    // Average per week (since user joined)
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const weeksSinceJoined = user
      ? Math.max(
          1,
          Math.ceil(
            (now.getTime() - new Date(user.joinedAt).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          ),
        )
      : 1;

    const averagePerWeek =
      Math.round((totalClasses / weeksSinceJoined) * 10) / 10;

    return {
      totalClasses,
      thisWeek,
      thisMonth,
      classesByDiscipline,
      averagePerWeek,
    };
  }

  private calculateCheckinXp(intensity?: TrainingIntensity): number {
    const baseXp = 50;
    const intensityMultiplier: Record<TrainingIntensity, number> = {
      light: 1.0,
      moderate: 1.25,
      high: 1.5,
      'all-out': 2.0,
    };

    const multiplier = intensity ? intensityMultiplier[intensity] : 1.0;
    return Math.round(baseXp * multiplier);
  }
}
