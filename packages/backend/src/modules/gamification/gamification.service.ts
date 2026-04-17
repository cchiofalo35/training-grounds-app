import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import type { StreakInfo, LeaderboardEntry, LeagueType } from '@training-grounds/shared';
import { UserEntity } from '../../entities/user.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { QuestEntity, UserQuestEntity } from '../../entities/quest.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { NotificationService } from '../notification/notification.service';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

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
    @InjectRepository(QuestEntity)
    private readonly questRepo: Repository<QuestEntity>,
    @InjectRepository(UserQuestEntity)
    private readonly userQuestRepo: Repository<UserQuestEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async getUserBadges(gymId: string, userId: string): Promise<UserBadgeEntity[]> {
    return this.userBadgeRepo.find({
      where: { gymId, userId },
      order: { earnedAt: 'DESC' },
      relations: ['badge'],
    });
  }

  async awardXp(
    gymId: string,
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
    await this.checkBadgeEligibility(gymId, userId);

    await this.notificationService.sendXpNotification(
      userId,
      amount,
      reason,
      user.totalXp,
    );

    return user.totalXp;
  }

  async updateStreak(gymId: string, userId: string): Promise<StreakInfo> {
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
    await this.checkStreakMilestones(gymId, user);

    return this.buildStreakInfo(user);
  }

  async getStreak(gymId: string, userId: string): Promise<StreakInfo> {
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

  async freezeStreak(gymId: string, userId: string): Promise<StreakInfo> {
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
    gymId: string,
    page: number,
    perPage: number,
    period: LeaderboardPeriod = 'all-time',
    league?: LeagueType,
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    if (period === 'all-time') {
      // All-time: sort by totalXp, scoped to gym members
      const qb = this.userRepo.createQueryBuilder('u')
        .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
        .where('gm.gymId = :gymId', { gymId })
        .andWhere('gm.isActive = true')
        .orderBy('u.totalXp', 'DESC');

      if (league) {
        const [minXp, maxXp] = this.leagueXpRange(league);
        qb.andWhere('u.totalXp >= :minXp', { minXp });
        if (maxXp !== null) {
          qb.andWhere('u.totalXp < :maxXp', { maxXp });
        }
      }

      const total = await qb.getCount();
      const users = await qb
        .skip((page - 1) * perPage)
        .take(perPage)
        .getMany();

      const entries = users.map((user, index) => ({
        rank: (page - 1) * perPage + index + 1,
        userId: user.id,
        userName: user.name,
        avatarUrl: user.avatarUrl ?? undefined,
        beltRank: user.beltRank,
        xp: user.totalXp,
        league: this.calculateLeague(user.totalXp),
        rankChange: 0,
      }));

      return { entries, total };
    }

    // Weekly/Monthly: aggregate XP from attendance records in the period, scoped to gym
    const periodStart = this.getPeriodStart(period);

    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.userId', 'userId')
      .addSelect('SUM(a.xpEarned)', 'periodXp')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.checkedInAt >= :periodStart', { periodStart })
      .groupBy('a.userId')
      .orderBy('"periodXp"', 'DESC');

    const rawResults = await qb.getRawMany<{ userId: string; periodXp: string }>();
    const total = rawResults.length;

    const pageResults = rawResults.slice((page - 1) * perPage, page * perPage);
    const userIds = pageResults.map((r) => r.userId);

    if (userIds.length === 0) {
      return { entries: [], total: 0 };
    }

    const users = await this.userRepo.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntry[] = pageResults.map((row, index) => {
      const user = userMap.get(row.userId);
      const xp = parseInt(row.periodXp, 10);
      return {
        rank: (page - 1) * perPage + index + 1,
        userId: row.userId,
        userName: user?.name ?? 'Unknown',
        avatarUrl: user?.avatarUrl ?? undefined,
        beltRank: user?.beltRank ?? 'white',
        xp,
        league: this.calculateLeague(user?.totalXp ?? 0),
        rankChange: 0,
      };
    });

    return { entries, total };
  }

  async getAllBadges(gymId: string): Promise<BadgeEntity[]> {
    return this.badgeRepo.find({
      where: { gymId },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getBadgeCatalog(gymId: string, userId: string): Promise<{
    badges: Array<BadgeEntity & { earned: boolean; earnedAt: string | null }>;
  }> {
    const allBadges = await this.badgeRepo.find({
      where: { gymId },
      order: { category: 'ASC', name: 'ASC' },
    });
    const earnedBadges = await this.userBadgeRepo.find({ where: { gymId, userId } });
    const earnedMap = new Map(earnedBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

    const badges = allBadges
      .filter((b) => !b.isHidden || earnedMap.has(b.id))
      .map((b) => ({
        ...b,
        earned: earnedMap.has(b.id),
        earnedAt: earnedMap.get(b.id)?.toISOString() ?? null,
      }));

    return { badges };
  }

  // ==================== Quest Methods ====================

  async getActiveQuests(gymId: string): Promise<QuestEntity[]> {
    return this.questRepo.find({
      where: { gymId, isActive: true },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async getUserQuests(gymId: string, userId: string): Promise<UserQuestEntity[]> {
    return this.userQuestRepo.find({
      where: { gymId, userId },
      relations: ['quest'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveQuestsWithProgress(gymId: string, userId: string): Promise<Array<{
    quest: QuestEntity;
    progress: number;
    completedAt: string | null;
  }>> {
    const activeQuests = await this.getActiveQuests(gymId);
    const userQuests = await this.userQuestRepo.find({ where: { gymId, userId } });
    const progressMap = new Map(userQuests.map((uq) => [uq.questId, uq]));

    // Calculate live progress for each quest
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyRecords = await this.attendanceRepo.count({
      where: { gymId, userId, checkedInAt: MoreThanOrEqual(startOfWeek) },
    });

    const monthlyRecords = await this.attendanceRepo.count({
      where: { gymId, userId, checkedInAt: MoreThanOrEqual(startOfMonth) },
    });

    const weeklyDisciplines = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('DISTINCT a.discipline')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.userId = :userId', { userId })
      .andWhere('a.checkedInAt >= :start', { start: startOfWeek })
      .getRawMany();

    return activeQuests.map((quest) => {
      const userQuest = progressMap.get(quest.id);
      let progress = userQuest?.progress ?? 0;

      // Calculate live progress from criteria
      const criteria = quest.criteriaJson;
      if (criteria['type'] === 'attendance_count') {
        const period = criteria['period'] as string;
        const threshold = criteria['threshold'] as number;
        const count = period === 'week' ? weeklyRecords : monthlyRecords;
        progress = Math.min(count, threshold);
      }
      if (criteria['type'] === 'discipline_variety') {
        progress = Math.min(weeklyDisciplines.length, criteria['threshold'] as number);
      }

      return {
        quest,
        progress,
        completedAt: userQuest?.completedAt?.toISOString() ?? null,
      };
    });
  }

  private async checkBadgeEligibility(gymId: string, userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const allBadges = await this.badgeRepo.find({ where: { gymId } });
    const earnedBadgeIds = (
      await this.userBadgeRepo.find({ where: { gymId, userId } })
    ).map((ub) => ub.badgeId);

    const totalClasses = await this.attendanceRepo.count({
      where: { gymId, userId },
    });

    // Build discipline counts for discipline-based badges
    const disciplineCounts = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.discipline', 'discipline')
      .addSelect('COUNT(*)', 'count')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.userId = :userId', { userId })
      .groupBy('a.discipline')
      .getRawMany<{ discipline: string; count: string }>();

    const countByDiscipline: Record<string, number> = {};
    for (const row of disciplineCounts) {
      countByDiscipline[row.discipline] = parseInt(row.count, 10);
    }

    // Get latest check-in time for custom badges
    const latestCheckin = await this.attendanceRepo.findOne({
      where: { gymId, userId },
      order: { checkedInAt: 'DESC' },
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

      // Check discipline count badges (e.g., "10 BJJ classes")
      if (
        criteria['type'] === 'discipline_count' &&
        typeof criteria['discipline'] === 'string' &&
        typeof criteria['threshold'] === 'number'
      ) {
        const count = countByDiscipline[criteria['discipline']] ?? 0;
        earned = count >= criteria['threshold'];
      }

      // Check multi-discipline badges (e.g., "10 classes each in BJJ, MT, MMA")
      if (
        criteria['type'] === 'multi_discipline' &&
        Array.isArray(criteria['disciplines']) &&
        typeof criteria['threshold'] === 'number'
      ) {
        const disciplines = criteria['disciplines'] as string[];
        earned = disciplines.every(
          (d) => (countByDiscipline[d] ?? 0) >= (criteria['threshold'] as number),
        );
      }

      // Check custom badges (e.g., "Midnight Warrior" — check in after 10 PM)
      if (criteria['type'] === 'custom' && typeof criteria['key'] === 'string') {
        if (criteria['key'] === 'late_checkin_22' && latestCheckin) {
          const checkinHour = new Date(latestCheckin.checkedInAt).getHours();
          earned = checkinHour >= 22;
        }
        if (criteria['key'] === 'comeback_30') {
          // User had streak reset to 0 and built back to 30+
          earned = user.currentStreak >= 30 && user.longestStreak > user.currentStreak;
        }
      }

      if (earned) {
        const userBadge = this.userBadgeRepo.create({
          gymId,
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

  private async checkStreakMilestones(gymId: string, user: UserEntity): Promise<void> {
    const milestones: Record<number, { xp: number; freezes: number }> = {
      7: { xp: 100, freezes: 1 },
      14: { xp: 250, freezes: 0 },
      30: { xp: 500, freezes: 2 },
      60: { xp: 1000, freezes: 2 },
      100: { xp: 2500, freezes: 3 },
      365: { xp: 10000, freezes: 5 },
    };

    const milestone = milestones[user.currentStreak];
    if (milestone) {
      await this.awardXp(gymId, user.id, milestone.xp, `streak_milestone_${user.currentStreak}`);

      // Grant streak freezes at milestones
      if (milestone.freezes > 0) {
        user.streakFreezes += milestone.freezes;
        await this.userRepo.save(user);
      }
    }
  }

  private getPeriodStart(period: LeaderboardPeriod): Date {
    const now = new Date();
    if (period === 'weekly') {
      const start = new Date(now);
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      start.setHours(0, 0, 0, 0);
      return start;
    }
    // monthly
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private leagueXpRange(league: LeagueType): [number, number | null] {
    const ranges: Record<LeagueType, [number, number | null]> = {
      'bronze': [0, 2000],
      'silver': [2000, 5000],
      'gold': [5000, 10000],
      'platinum': [10000, 25000],
      'diamond': [25000, 50000],
      'black-belt-elite': [50000, null],
    };
    return ranges[league];
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
