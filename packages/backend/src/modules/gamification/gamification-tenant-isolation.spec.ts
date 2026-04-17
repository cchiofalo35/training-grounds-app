import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { UserEntity } from '../../entities/user.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { QuestEntity, UserQuestEntity } from '../../entities/quest.entity';
import { NotificationService } from '../notification/notification.service';

const GYM_A = 'gym-a-uuid';
const GYM_B = 'gym-b-uuid';
const USER_ID = 'user-uuid';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  findByIds: jest.fn().mockResolvedValue([]),
  save: jest.fn((entity: any) => {
    if (Array.isArray(entity))
      return Promise.resolve(
        entity.map((e: any, i: number) => ({ id: `mock-${i}`, ...e })),
      );
    return Promise.resolve({ id: 'mock-uuid', ...entity });
  }),
  create: jest.fn((entity: any) => entity),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockNotificationService = {
  sendXpNotification: jest.fn(),
  sendBadgeEarnedNotification: jest.fn(),
  sendStreakMilestoneNotification: jest.fn(),
};

describe('GamificationService — tenant isolation', () => {
  let service: GamificationService;
  let userRepo: ReturnType<typeof mockRepo>;
  let badgeRepo: ReturnType<typeof mockRepo>;
  let userBadgeRepo: ReturnType<typeof mockRepo>;
  let attendanceRepo: ReturnType<typeof mockRepo>;
  let questRepo: ReturnType<typeof mockRepo>;
  let userQuestRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    userRepo = mockRepo();
    badgeRepo = mockRepo();
    userBadgeRepo = mockRepo();
    attendanceRepo = mockRepo();
    questRepo = mockRepo();
    userQuestRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(BadgeEntity), useValue: badgeRepo },
        { provide: getRepositoryToken(UserBadgeEntity), useValue: userBadgeRepo },
        { provide: getRepositoryToken(AttendanceRecordEntity), useValue: attendanceRepo },
        { provide: getRepositoryToken(QuestEntity), useValue: questRepo },
        { provide: getRepositoryToken(UserQuestEntity), useValue: userQuestRepo },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBadges', () => {
    it('returns only badges earned within the requested gym', async () => {
      userBadgeRepo.find.mockResolvedValue([]);

      await service.getUserBadges(GYM_A, USER_ID);

      expect(userBadgeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, userId: USER_ID },
        }),
      );

      // Verify GYM_B is never referenced
      expect(userBadgeRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
    });
  });

  describe('awardXp', () => {
    it('checks badge eligibility only against the correct gym badges', async () => {
      const mockUser = {
        id: USER_ID,
        totalXp: 100,
        currentStreak: 5,
        longestStreak: 10,
        streakFreezes: 2,
        streakFreezesUsed: 0,
        lastCheckinDate: null,
      };
      userRepo.findOne.mockResolvedValue({ ...mockUser });
      userRepo.save.mockResolvedValue({ ...mockUser, totalXp: 150 });
      badgeRepo.find.mockResolvedValue([]);
      userBadgeRepo.find.mockResolvedValue([]);
      attendanceRepo.count.mockResolvedValue(0);

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQb);
      attendanceRepo.findOne.mockResolvedValue(null);

      await service.awardXp(GYM_A, USER_ID, 50, 'test_reason');

      // checkBadgeEligibility should query badges scoped to GYM_A
      expect(badgeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A },
        }),
      );

      // Verify GYM_B badges are never queried
      expect(badgeRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_B },
        }),
      );
    });
  });

  describe('getAllBadges', () => {
    it('returns only badges defined for the requested gym', async () => {
      badgeRepo.find.mockResolvedValue([]);

      await service.getAllBadges(GYM_A);

      expect(badgeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A },
        }),
      );

      expect(badgeRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
    });
  });

  describe('getBadgeCatalog', () => {
    it('returns only gym-scoped badges and user_badges', async () => {
      badgeRepo.find.mockResolvedValue([]);
      userBadgeRepo.find.mockResolvedValue([]);

      await service.getBadgeCatalog(GYM_A, USER_ID);

      // Both badge and user_badge repos should be queried with GYM_A
      expect(badgeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A },
        }),
      );
      expect(userBadgeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, userId: USER_ID },
        }),
      );

      // GYM_B should never appear
      expect(badgeRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
      expect(userBadgeRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
    });
  });

  describe('getLeaderboard — all-time', () => {
    it('includes only members of the requested gym', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getLeaderboard(GYM_A, 1, 10, 'all-time');

      // Verify the query builder filters by GYM_A gym membership
      expect(mockQb.where).toHaveBeenCalledWith('gm.gymId = :gymId', {
        gymId: GYM_A,
      });

      // Verify GYM_B is never used in the where clause
      expect(mockQb.where).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ gymId: GYM_B }),
      );
    });
  });

  describe('getLeaderboard — weekly/monthly', () => {
    it('aggregates XP only from the requested gym attendance', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getLeaderboard(GYM_A, 1, 10, 'weekly');

      // Verify the query builder filters attendance by GYM_A
      expect(mockQb.where).toHaveBeenCalledWith('a.gymId = :gymId', {
        gymId: GYM_A,
      });

      expect(mockQb.where).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ gymId: GYM_B }),
      );
    });

    it('aggregates XP only from the requested gym attendance for monthly period', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getLeaderboard(GYM_A, 1, 10, 'monthly');

      expect(mockQb.where).toHaveBeenCalledWith('a.gymId = :gymId', {
        gymId: GYM_A,
      });
    });
  });

  describe('getActiveQuests', () => {
    it('returns only quests for the requested gym', async () => {
      questRepo.find.mockResolvedValue([]);

      await service.getActiveQuests(GYM_A);

      expect(questRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, isActive: true },
        }),
      );

      expect(questRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
    });
  });

  describe('getUserQuests', () => {
    it('returns only user quest progress within the requested gym', async () => {
      userQuestRepo.find.mockResolvedValue([]);

      await service.getUserQuests(GYM_A, USER_ID);

      expect(userQuestRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, userId: USER_ID },
        }),
      );

      expect(userQuestRepo.find).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_B }),
        }),
      );
    });
  });

  describe('getActiveQuestsWithProgress', () => {
    it('calculates progress using only gym-scoped attendance', async () => {
      questRepo.find.mockResolvedValue([]);
      userQuestRepo.find.mockResolvedValue([]);
      attendanceRepo.count.mockResolvedValue(0);

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getActiveQuestsWithProgress(GYM_A, USER_ID);

      // Quest repo should be scoped to GYM_A
      expect(questRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, isActive: true },
        }),
      );

      // User quest progress should be scoped to GYM_A
      expect(userQuestRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, userId: USER_ID },
        }),
      );

      // Attendance count calls should include gymId
      for (const call of attendanceRepo.count.mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            where: expect.objectContaining({ gymId: GYM_A }),
          }),
        );
      }

      // The query builder for discipline counting should filter by gymId
      if (attendanceRepo.createQueryBuilder.mock.calls.length > 0) {
        expect(mockQb.where).toHaveBeenCalledWith('a.gymId = :gymId', {
          gymId: GYM_A,
        });
      }
    });
  });

  describe('badge eligibility — cross-gym', () => {
    it('does not award Gym B badges based on Gym A attendance', async () => {
      // Simulate awardXp for GYM_A which triggers checkBadgeEligibility
      const mockUser = {
        id: USER_ID,
        totalXp: 500,
        currentStreak: 5,
        longestStreak: 10,
        streakFreezes: 2,
        streakFreezesUsed: 0,
        lastCheckinDate: null,
      };
      userRepo.findOne.mockResolvedValue({ ...mockUser });
      userRepo.save.mockResolvedValue({ ...mockUser, totalXp: 550 });

      // GYM_A has one badge, but we should never see GYM_B badges
      const gymABadge = {
        id: 'badge-gym-a',
        gymId: GYM_A,
        name: 'Gym A Warrior',
        criteriaJson: { type: 'attendance_count', threshold: 5 },
        isHidden: false,
      };
      badgeRepo.find.mockResolvedValue([gymABadge]);
      userBadgeRepo.find.mockResolvedValue([]);
      attendanceRepo.count.mockResolvedValue(10);
      attendanceRepo.findOne.mockResolvedValue(null);

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.awardXp(GYM_A, USER_ID, 50, 'test');

      // Badge eligibility check should only query GYM_A badges
      expect(badgeRepo.find).toHaveBeenCalledWith({ where: { gymId: GYM_A } });
      expect(badgeRepo.find).not.toHaveBeenCalledWith({
        where: { gymId: GYM_B },
      });

      // Attendance count for badge checks should be GYM_A scoped
      expect(attendanceRepo.count).toHaveBeenCalledWith({
        where: { gymId: GYM_A, userId: USER_ID },
      });

      // Any awarded badges should be saved with GYM_A, not GYM_B
      if (userBadgeRepo.save.mock.calls.length > 0) {
        for (const call of userBadgeRepo.save.mock.calls) {
          const savedEntity = call[0];
          expect(savedEntity.gymId).toBe(GYM_A);
          expect(savedEntity.gymId).not.toBe(GYM_B);
        }
      }
    });
  });

  describe('leaderboard — league filter with gym scope', () => {
    it('applies league filter only within the requested gym', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getLeaderboard(GYM_A, 1, 10, 'all-time', 'gold');

      // Must scope to GYM_A first
      expect(mockQb.where).toHaveBeenCalledWith('gm.gymId = :gymId', {
        gymId: GYM_A,
      });

      // League XP filters should be applied via andWhere
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'u.totalXp >= :minXp',
        expect.objectContaining({ minXp: expect.any(Number) }),
      );
    });
  });
});
