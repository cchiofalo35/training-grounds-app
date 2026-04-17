import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { UserEntity } from '../../entities/user.entity';
import { ClassScheduleEntity } from '../../entities/class-schedule.entity';
import { GamificationService } from '../gamification/gamification.service';

interface CheckinDto {
  classId: string;
  className: string;
  discipline: Discipline;
  intensityRating?: TrainingIntensity;
}

interface CoachCheckinDto {
  classId: string;
  className: string;
  discipline: Discipline;
  classScheduleId?: string;
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
    gymId: string,
    userId: string,
    dto: CheckinDto,
  ): Promise<AttendanceRecordEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent duplicate check-ins for the same class
    const existing = await this.attendanceRepo.findOne({
      where: { gymId, userId, classId: dto.classId },
    });

    if (existing) {
      throw new BadRequestException('Already checked in to this class');
    }

    // Calculate XP earned for this check-in (with streak multiplier)
    const xpEarned = this.calculateCheckinXp(dto.intensityRating, user.currentStreak);

    const record = this.attendanceRepo.create({
      gymId,
      userId,
      classId: dto.classId,
      className: dto.className,
      discipline: dto.discipline,
      intensityRating: dto.intensityRating ?? null,
      xpEarned,
    });

    const savedRecord = await this.attendanceRepo.save(record);

    // Award XP and update streak via gamification service
    await this.gamificationService.awardXp(gymId, userId, xpEarned, 'checkin');
    await this.gamificationService.updateStreak(gymId, userId);

    return savedRecord;
  }

  async getHistory(
    gymId: string,
    userId: string,
    page: number,
    perPage: number,
  ): Promise<{ records: AttendanceRecordEntity[]; total: number }> {
    const [records, total] = await this.attendanceRepo.findAndCount({
      where: { gymId, userId },
      order: { checkedInAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { records, total };
  }

  async getStats(gymId: string, userId: string): Promise<AttendanceStats> {
    const totalClasses = await this.attendanceRepo.count({
      where: { gymId, userId },
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
        gymId,
        userId,
        checkedInAt: Between(startOfWeek, now),
      },
    });

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = await this.attendanceRepo.count({
      where: {
        gymId,
        userId,
        checkedInAt: Between(startOfMonth, now),
      },
    });

    // Discipline breakdown
    const disciplineBreakdown = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.discipline', 'discipline')
      .addSelect('COUNT(*)', 'count')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.userId = :userId', { userId })
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

  // ==================== Coach Check-in ====================

  async searchMembers(gymId: string, query: string): Promise<UserEntity[]> {
    // Search members who belong to this gym via gym_memberships
    return this.userRepo
      .createQueryBuilder('u')
      .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
      .where('gm.gymId = :gymId', { gymId })
      .andWhere('gm.isActive = true')
      .andWhere('(u.name ILIKE :q OR u.email ILIKE :q)', { q: `%${query}%` })
      .take(10)
      .orderBy('u.name', 'ASC')
      .getMany();
  }

  async coachCheckin(
    gymId: string,
    coachUserId: string,
    memberEmail: string,
    dto: CoachCheckinDto,
  ): Promise<AttendanceRecordEntity> {
    const member = await this.userRepo.findOne({ where: { email: memberEmail } });
    if (!member) {
      throw new NotFoundException('Member not found with that email');
    }

    const xpEarned = this.calculateCheckinXp(dto.intensityRating, member.currentStreak);

    const record = this.attendanceRepo.create({
      gymId,
      userId: member.id,
      classId: dto.classId,
      className: dto.className,
      discipline: dto.discipline,
      intensityRating: dto.intensityRating ?? null,
      xpEarned,
      checkedInByUserId: coachUserId,
      classScheduleId: dto.classScheduleId ?? null,
    });

    const savedRecord = await this.attendanceRepo.save(record);

    // Award XP and update streak
    await this.gamificationService.awardXp(gymId, member.id, xpEarned, 'checkin');
    await this.gamificationService.updateStreak(gymId, member.id);

    return savedRecord;
  }

  async getClassRoster(
    gymId: string,
    classScheduleId: string,
    date?: string,
  ): Promise<AttendanceRecordEntity[]> {
    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.classScheduleId = :classScheduleId', { classScheduleId });

    if (date) {
      qb.andWhere("DATE(a.checkedInAt) = :date", { date });
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      qb.andWhere("DATE(a.checkedInAt) = :date", { date: today });
    }

    return qb.orderBy('a.checkedInAt', 'ASC').getMany();
  }

  private calculateCheckinXp(intensity?: TrainingIntensity, currentStreak?: number): number {
    const baseXp = 50;
    const intensityMultiplier: Record<TrainingIntensity, number> = {
      light: 1.0,
      moderate: 1.25,
      high: 1.5,
      'all-out': 2.0,
    };

    // Streak-based XP multiplier per architecture spec
    let streakMultiplier = 1.0;
    if (currentStreak !== undefined) {
      if (currentStreak >= 100) streakMultiplier = 2.0;
      else if (currentStreak >= 60) streakMultiplier = 1.75;
      else if (currentStreak >= 30) streakMultiplier = 1.5;
      else if (currentStreak >= 7) streakMultiplier = 1.25;
    }

    const intMult = intensity ? intensityMultiplier[intensity] : 1.0;
    return Math.round(baseXp * intMult * streakMultiplier);
  }
}
