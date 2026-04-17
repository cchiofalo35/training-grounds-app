import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PersonalRecordEntity,
  type PrCategory,
} from '../../entities/personal-record.entity';
import { ChannelEntity } from '../../entities/channel.entity';
import { ChannelMessageEntity } from '../../entities/channel-message.entity';
import { UserEntity } from '../../entities/user.entity';
import { GamificationService } from '../gamification/gamification.service';

const PR_XP_REWARD = 100;

/**
 * PersonalRecordService — CrossFit PR tracking (tenant-scoped).
 *
 * Every method takes gymId as first arg (multi-tenant rule).
 *
 * When a new PR beats the previous best for (gym, user, movement):
 *   1. Mark as all-time PR
 *   2. Calculate improvement delta over previous best
 *   3. Award +100 XP via GamificationService (triggers badge eligibility)
 *   4. Post an automatic message to the #pr-bell channel
 */
@Injectable()
export class PersonalRecordService {
  constructor(
    @InjectRepository(PersonalRecordEntity)
    private readonly prRepo: Repository<PersonalRecordEntity>,
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
    @InjectRepository(ChannelMessageEntity)
    private readonly messageRepo: Repository<ChannelMessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly gamificationService: GamificationService,
  ) {}

  async createPr(
    gymId: string,
    userId: string,
    input: {
      category: PrCategory;
      movementName: string;
      valueNumeric: number;
      valueUnit: string;
      isBodyweight?: boolean;
      bodyweightAtLog?: number;
      loggedAt?: string;
      notes?: string;
      videoUrl?: string;
    },
  ): Promise<{ pr: PersonalRecordEntity; isNewPr: boolean; xpAwarded: number }> {
    const movement = input.movementName.trim();
    const previous = await this.getBestPr(gymId, userId, movement);

    // For benchmark WODs value = seconds, so a LOWER value is better.
    // For lifts and gymnastics, a HIGHER value is better.
    const lowerIsBetter = input.category === 'benchmark_wod';
    const isNewPr = previous
      ? lowerIsBetter
        ? input.valueNumeric < Number(previous.valueNumeric)
        : input.valueNumeric > Number(previous.valueNumeric)
      : true;

    const improvement = previous
      ? Math.abs(input.valueNumeric - Number(previous.valueNumeric))
      : null;

    const saved = await this.dataSource.transaction(async (manager) => {
      // If this is a new all-time PR, unset the flag on prior rows for this movement.
      if (isNewPr) {
        await manager.update(
          PersonalRecordEntity,
          { gymId, userId, movementName: movement, isAllTimePr: true },
          { isAllTimePr: false },
        );
      }

      const pr = manager.create(PersonalRecordEntity, {
        gymId,
        userId,
        category: input.category,
        movementName: movement,
        valueNumeric: input.valueNumeric.toString(),
        valueUnit: input.valueUnit as 'kg' | 'lbs' | 'seconds' | 'reps',
        previousBest: previous ? previous.valueNumeric : null,
        improvementAmount: improvement !== null ? improvement.toString() : null,
        isAllTimePr: isNewPr,
        isBodyweight: input.isBodyweight ?? false,
        bodyweightAtLog:
          input.bodyweightAtLog !== undefined ? input.bodyweightAtLog.toString() : null,
        loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
        notes: input.notes ?? null,
        videoUrl: input.videoUrl ?? null,
      });

      return manager.save(PersonalRecordEntity, pr);
    });

    let xpAwarded = 0;
    if (isNewPr) {
      xpAwarded = PR_XP_REWARD;
      // Award XP — this also checks badge eligibility
      await this.gamificationService.awardXp(
        gymId,
        userId,
        PR_XP_REWARD,
        `New PR: ${movement}`,
      );

      // Post to #pr-bell channel (fire-and-forget; failure shouldn't block PR creation)
      await this.postPrBellMessage(gymId, userId, saved).catch(() => undefined);
    }

    return { pr: saved, isNewPr, xpAwarded };
  }

  async getBestPr(
    gymId: string,
    userId: string,
    movementName: string,
  ): Promise<PersonalRecordEntity | null> {
    // For benchmark WODs the best PR is the LOWEST time. For lifts/gymnastics it's the HIGHEST.
    // Because we store "isAllTimePr" on the row itself, we just find the latest allTimePr record.
    const result = await this.prRepo.findOne({
      where: { gymId, userId, movementName, isAllTimePr: true },
      order: { loggedAt: 'DESC' },
    });
    return result ?? null;
  }

  async getUserPrs(
    gymId: string,
    userId: string,
    options: { category?: PrCategory; movementName?: string } = {},
  ): Promise<PersonalRecordEntity[]> {
    const where: Record<string, unknown> = { gymId, userId };
    if (options.category) where.category = options.category;
    if (options.movementName) where.movementName = options.movementName;

    return this.prRepo.find({
      where,
      order: { loggedAt: 'DESC' },
    });
  }

  async getPrHistory(
    gymId: string,
    userId: string,
    movementName: string,
  ): Promise<PersonalRecordEntity[]> {
    return this.prRepo.find({
      where: { gymId, userId, movementName },
      order: { loggedAt: 'ASC' },
    });
  }

  /**
   * Leaderboard for a single movement, scoped by gymId.
   * Returns each user's best PR for that movement, sorted by value.
   * For benchmark WODs lower time wins; for everything else higher value wins.
   */
  async getLeaderboardForMovement(
    gymId: string,
    movementName: string,
    limit = 50,
  ): Promise<
    Array<{
      rank: number;
      userId: string;
      userName: string | null;
      valueNumeric: number;
      valueUnit: string;
      loggedAt: Date;
    }>
  > {
    // Fetch the best (isAllTimePr = true, latest) row per user for this movement
    const rows = await this.prRepo
      .createQueryBuilder('pr')
      .innerJoin(UserEntity, 'u', 'u.id = pr.userId')
      .select([
        'pr.userId AS "userId"',
        'pr.valueNumeric AS "valueNumeric"',
        'pr.valueUnit AS "valueUnit"',
        'pr.category AS "category"',
        'pr.loggedAt AS "loggedAt"',
        'u.name AS "userName"',
      ])
      .where('pr.gymId = :gymId', { gymId })
      .andWhere('pr.movementName = :movementName', { movementName })
      .andWhere('pr.isAllTimePr = true')
      .limit(limit)
      .getRawMany<{
        userId: string;
        valueNumeric: string;
        valueUnit: string;
        category: PrCategory;
        loggedAt: Date;
        userName: string | null;
      }>();

    const isBenchmark = rows.length > 0 && rows[0].category === 'benchmark_wod';
    const sorted = rows
      .map((r) => ({
        userId: r.userId,
        userName: r.userName,
        valueNumeric: Number(r.valueNumeric),
        valueUnit: r.valueUnit,
        loggedAt: r.loggedAt,
      }))
      .sort((a, b) =>
        isBenchmark ? a.valueNumeric - b.valueNumeric : b.valueNumeric - a.valueNumeric,
      )
      .slice(0, limit)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }));

    return sorted;
  }

  async verifyPr(
    gymId: string,
    coachId: string,
    coachRole: string,
    prId: string,
  ): Promise<PersonalRecordEntity> {
    if (coachRole !== 'coach' && coachRole !== 'admin') {
      throw new ForbiddenException('Only coaches can verify PRs');
    }
    const pr = await this.prRepo.findOne({ where: { id: prId, gymId } });
    if (!pr) throw new NotFoundException('PR not found');

    pr.verifiedByCoachId = coachId;
    pr.verifiedAt = new Date();
    return this.prRepo.save(pr);
  }

  async deletePr(gymId: string, userId: string, prId: string): Promise<void> {
    const pr = await this.prRepo.findOne({ where: { id: prId, gymId } });
    if (!pr) throw new NotFoundException('PR not found');
    if (pr.userId !== userId) {
      throw new ForbiddenException('You can only delete your own PRs');
    }
    await this.prRepo.remove(pr);

    // If this was the all-time PR, re-mark the new best
    if (pr.isAllTimePr) {
      await this.recomputeAllTimePr(gymId, userId, pr.movementName);
    }
  }

  private async recomputeAllTimePr(
    gymId: string,
    userId: string,
    movementName: string,
  ): Promise<void> {
    const all = await this.prRepo.find({
      where: { gymId, userId, movementName },
      order: { loggedAt: 'ASC' },
    });
    if (all.length === 0) return;

    const isBenchmark = all[0].category === 'benchmark_wod';
    const best = all.reduce((acc, cur) => {
      if (!acc) return cur;
      const curVal = Number(cur.valueNumeric);
      const accVal = Number(acc.valueNumeric);
      if (isBenchmark) return curVal < accVal ? cur : acc;
      return curVal > accVal ? cur : acc;
    }, undefined as PersonalRecordEntity | undefined);

    if (!best) return;

    // Clear all flags then set the winner
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        PersonalRecordEntity,
        { gymId, userId, movementName },
        { isAllTimePr: false },
      );
      await manager.update(PersonalRecordEntity, { id: best.id }, { isAllTimePr: true });
    });
  }

  private async postPrBellMessage(
    gymId: string,
    userId: string,
    pr: PersonalRecordEntity,
  ): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { gymId, name: 'pr-bell' },
    });
    if (!channel) return; // gym doesn't have a pr-bell channel — skip silently

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const userName = user?.name ?? 'A member';

    const content = this.formatPrBellMessage(userName, pr);
    const message = this.messageRepo.create({
      gymId,
      channelId: channel.id,
      userId,
      content,
    });
    await this.messageRepo.save(message);
  }

  private formatPrBellMessage(userName: string, pr: PersonalRecordEntity): string {
    const value = Number(pr.valueNumeric);
    const unit = pr.valueUnit;
    const improvementStr = pr.improvementAmount
      ? ` (+${Number(pr.improvementAmount)}${unit === 'seconds' ? 's faster' : ` ${unit}`})`
      : ' (first PR logged 🎉)';

    if (pr.category === 'benchmark_wod') {
      const formatted = this.formatSeconds(value);
      return `🔔 PR BELL! ${userName} just crushed ${pr.movementName} in ${formatted}${improvementStr}`;
    }

    return `🔔 PR BELL! ${userName} hit a new ${pr.movementName} PR: ${value}${unit}${improvementStr}`;
  }

  private formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
