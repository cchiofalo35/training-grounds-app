import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { UserBadgeEntity } from '../../entities/badge.entity';

interface UpdateUserDto {
  name?: string;
  avatarUrl?: string;
}

export interface UserStats {
  totalClasses: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
  classesByDiscipline: Record<string, number>;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    @InjectRepository(UserBadgeEntity)
    private readonly userBadgeRepo: Repository<UserBadgeEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    return this.userRepo.save(user);
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.findById(userId);

    const totalClasses = await this.attendanceRepo.count({
      where: { userId },
    });

    const badgeCount = await this.userBadgeRepo.count({
      where: { userId },
    });

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

    return {
      totalClasses,
      totalXp: user.totalXp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      badgeCount,
      classesByDiscipline,
    };
  }
}
