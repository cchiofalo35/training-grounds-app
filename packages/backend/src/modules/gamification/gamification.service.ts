import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StreakInfo, LeaderboardEntry, LeagueType } from '@training-grounds/shared';
import { UserEntity } from '../../entities/user.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(BadgeEntity)
    private readonly badgeRepo: Repository<BadgeEntity>,
    @InjectRepository(UserBadgeEntity)
    private readonly userBadgeRepo: Repository<UserBadgeEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async getUserBadges(userId: string): Promise<UserBadgeEntity[]> {
    return this.userBadgeRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
      relations: ['badge'],
    });
  }

  async awardXp(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.totalXp += amount;
    await this.userRepo.save(user);

    // Check for badge eligibility after XP award
    await this.checkBadgeEligibility(userId);

    await this.notificationService.sendXpNotification(
      userId,
      amount,
      reason,
      user.totalXp,
    );

    return user.totalXp;
  }

  async updateStreak(userId: string): Promise<StreakInfo> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = user.lastCheckinDate;

    if (lastCheckin === today) {
      // Already checked in today, no streak update needed
      return this.buildStreakInfo(user);
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastCheckin === yesterdayStr) {
      // Consecutive day: increment streak
      user.currentStreak += 1;
    } else if (lastCheckin === null) {
      // First ever check-in
      user.currentStreak = 1;
    } else {
      // Streak broken: check for freeze
      const daysSinceCheckin = this.daysBetween(lastCheckin, today);

      if (daysSinceCheckin <= 2 && user.streakFreezes > user.streakFreezesUsed) {
        // Use a streak freeze
        user.streakFreezesUsed += 1;
        user.currentStreak += 1;
      } else {
        // Streak broken
        user.currentStreak = 1;
      }
    }

    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    user.lastCheckinDate = today;
    await this.userRepo.save(user);

    // Bonus XP for streak milestones
    await this.checkStreakMilestones(user);

    return this.buildStreakInfo(user);
  }

  async getStreak(userId: string): Promise<StreakInfo> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if streak is still active (user checked in today or yesterday)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isActive =
      user.lastCheckinDate === today || user.lastCheckinDate === yesterdayStr;

    return {
      currentStreak: isActive ? user.currentStreak : 0,
      longestStreak: user.longestStreak,
      lastCheckinDate: user.lastCheckinDate ?? '',
      freezesAvailable: user.streakFreezes - user.streakFreezesUsed,
      freezesUsed: user.streakFreezesUsed,
      isActive,
    };
  }

  async freezeStreak(userId: string): Promise<StreakInfo> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const available = user.streakFreezes - user.streakFreezesUsed;
    if (available <= 0) {
      throw new BadRequestException('No streak freezes available');
    }

    user.streakFreezesUsed += 1;

    // Extend the "last checkin" to today so streak does not break
    const today = new Date().toISOString().split('T')[0];
    user.lastCheckinDate = today;

    await this.userRepo.save(user);

    return this.buildStreakInfo(user);
  }

  async getLeaderboard(
    page: number,
    perPage: number,
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const [users, total] = await this.userRepo.findAndCount({
      order: { totalXp: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const entries: LeaderboardEntry[] = users.map((user, index) => ({
      rank: (page - 1) * perPage + index + 1,
      userId: user.id,
      userName: user.name,
      avatarUrl: user.avatarUrl ?? undefined,
      beltRank: user.beltRank,
      xp: user.totalXp,
      league: this.calculateLeague(user.totalXp),
      rankChange: 0, // TODO: track rank changes with Redis
    }));

    return { entries, total };
  }

  private async checkBadgeEligibility(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const allBadges = await this.badgeRepo.find();
    const earnedBadgeIds = (
      await this.userBadgeRepo.find({ where: { userId } })
    ).map((ub) => ub.badgeId);

    const totalClasses = await this.attendanceRepo.count({
      where: { userId },
    });

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      const criteria = badge.criteriaJson;
      let earned = false;

      // Check attendance threshold badges
      if (
        criteria['type'] === 'attendance_count' &&
        typeof criteria['threshold'] === 'number'
      ) {
        earned = totalClasses >= criteria['threshold'];
      }

      // Check XP threshold badges
      if (
        criteria['type'] === 'xp_total' &&
        typeof criteria['threshold'] === 'number'
      ) {
        earned = user.totalXp >= criteria['threshold'];
      }

      // Check streak badges
      if (
        criteria['type'] === 'streak' &&
        typeof criteria['threshold'] === 'number'
      ) {
        earned = user.longestStreak >= criteria['threshold'];
      }

      if (earned) {
        const userBadge = this.userBadgeRepo.create({
          userId,
          badgeId: badge.id,
        });
        await this.userBadgeRepo.save(userBadge);

        await this.notificationService.sendBadgeEarnedNotification(
          userId,
          badge.name,
        );
      }
    }
  }

  private async checkStreakMilestones(user: UserEntity): Promise<void> {
    const milestoneXp: Record<number, number> = {
      7: 100,
      14: 250,
      30: 500,
      60: 1000,
      100: 2500,
      365: 10000,
    };

    const bonus = milestoneXp[user.currentStreak];
    if (bonus) {
      await this.awardXp(user.id, bonus, `streak_milestone_${user.currentStreak}`);
    }
  }

  private calculateLeague(xp: number): LeagueType {
    if (xp >= 50000) return 'black-belt-elite';
    if (xp >= 25000) return 'diamond';
    if (xp >= 10000) return 'platinum';
    if (xp >= 5000) return 'gold';
    if (xp >= 2000) return 'silver';
    return 'bronze';
  }

  private buildStreakInfo(user: UserEntity): StreakInfo {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastCheckinDate: user.lastCheckinDate ?? '',
      freezesAvailable: user.streakFreezes - user.streakFreezesUsed,
      freezesUsed: user.streakFreezesUsed,
      isActive: true,
    };
  }

  private daysBetween(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }
}
