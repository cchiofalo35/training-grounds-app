import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { AttendanceService } from './attendance.service';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { UserEntity } from '../../entities/user.entity';
import { GamificationService } from '../gamification/gamification.service';

const GYM_A = 'gym-a-uuid';
const GYM_B = 'gym-b-uuid';
const USER_ID = 'user-uuid';

const mockQb = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
  getCount: jest.fn().mockResolvedValue(0),
  getRawMany: jest.fn().mockResolvedValue([]),
  getRawOne: jest.fn().mockResolvedValue(null),
});

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
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

const mockGamificationService = {
  awardXp: jest.fn().mockResolvedValue(100),
  updateStreak: jest.fn().mockResolvedValue({ currentStreak: 1 }),
};

describe('AttendanceService — tenant isolation', () => {
  let service: AttendanceService;
  let attendanceRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    attendanceRepo = mockRepo();
    userRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(AttendanceRecordEntity),
          useValue: attendanceRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepo,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const checkinDto = {
    classId: 'class-123',
    className: 'Fundamentals BJJ',
    discipline: 'bjj-gi' as Discipline,
    intensityRating: 'moderate' as TrainingIntensity,
  };

  describe('checkin', () => {
    it('allows same classId in different gyms without conflict', async () => {
      userRepo.findOne.mockResolvedValue({
        id: USER_ID,
        currentStreak: 5,
      });
      // No existing record for GYM_A + classId
      attendanceRepo.findOne.mockResolvedValue(null);

      await service.checkin(GYM_A, USER_ID, checkinDto);

      // Duplicate check must include gymId
      expect(attendanceRepo.findOne).toHaveBeenCalledWith({
        where: { gymId: GYM_A, userId: USER_ID, classId: checkinDto.classId },
      });
    });

    it('saves attendance record scoped to the correct gymId', async () => {
      userRepo.findOne.mockResolvedValue({
        id: USER_ID,
        currentStreak: 0,
      });
      attendanceRepo.findOne.mockResolvedValue(null);

      await service.checkin(GYM_A, USER_ID, checkinDto);

      expect(attendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gymId: GYM_A, userId: USER_ID }),
      );
      expect(attendanceRepo.save).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('returns only records for the requested gym', async () => {
      attendanceRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getHistory(GYM_A, USER_ID, 1, 20);

      expect(attendanceRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, userId: USER_ID },
        }),
      );
    });

    it('does not leak Gym B records when querying as Gym A', async () => {
      const gymBRecord = {
        id: 'rec-b',
        gymId: GYM_B,
        userId: USER_ID,
        className: 'Muay Thai',
      };
      // Gym A query returns nothing
      attendanceRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getHistory(GYM_A, USER_ID, 1, 20);

      expect(result.records).toEqual([]);
      expect(result.total).toBe(0);
      // Verify the where clause explicitly filters by GYM_A
      const callArgs = attendanceRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.gymId).toBe(GYM_A);
      expect(callArgs.where.gymId).not.toBe(GYM_B);
    });
  });

  describe('getStats', () => {
    it('counts only attendance within the requested gym', async () => {
      attendanceRepo.count.mockResolvedValue(0);
      userRepo.findOne.mockResolvedValue({
        id: USER_ID,
        joinedAt: new Date(),
      });

      const qb = mockQb();
      attendanceRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getStats(GYM_A, USER_ID);

      // Total classes count must include gymId
      expect(attendanceRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: GYM_A, userId: USER_ID }),
        }),
      );

      // Discipline breakdown QueryBuilder must filter by gymId
      expect(qb.where).toHaveBeenCalledWith('a.gymId = :gymId', {
        gymId: GYM_A,
      });
    });

    it('filters weekly and monthly counts by gymId', async () => {
      attendanceRepo.count.mockResolvedValue(0);
      userRepo.findOne.mockResolvedValue({
        id: USER_ID,
        joinedAt: new Date(),
      });

      const qb = mockQb();
      attendanceRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getStats(GYM_A, USER_ID);

      // count is called 3 times: totalClasses, thisWeek, thisMonth
      // All 3 must include gymId in their where clause
      for (const call of attendanceRepo.count.mock.calls) {
        expect(call[0].where).toHaveProperty('gymId', GYM_A);
      }
    });
  });

  describe('searchMembers', () => {
    it('returns only members belonging to the requested gym', async () => {
      const qb = mockQb();
      userRepo.createQueryBuilder.mockReturnValue(qb);

      await service.searchMembers(GYM_A, 'john');

      expect(qb.where).toHaveBeenCalledWith('gm.gymId = :gymId', {
        gymId: GYM_A,
      });
    });

    it('does not return members from Gym B when searching in Gym A', async () => {
      const qb = mockQb();
      userRepo.createQueryBuilder.mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);

      const result = await service.searchMembers(GYM_A, 'john');

      expect(result).toEqual([]);
      // Confirm gymId filter was applied
      const whereCall = qb.where.mock.calls[0];
      expect(whereCall[0]).toContain('gymId');
      expect(whereCall[1]).toEqual({ gymId: GYM_A });
    });
  });

  describe('coachCheckin', () => {
    it('creates attendance record scoped to the correct gym', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'member-uuid',
        email: 'member@example.com',
        currentStreak: 3,
      });

      const coachDto = {
        classId: 'class-456',
        className: 'Advanced BJJ',
        discipline: 'bjj-gi' as Discipline,
      };

      await service.coachCheckin(GYM_A, 'coach-uuid', 'member@example.com', coachDto);

      expect(attendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gymId: GYM_A,
          userId: 'member-uuid',
          checkedInByUserId: 'coach-uuid',
        }),
      );
    });
  });

  describe('getClassRoster', () => {
    it('returns only roster entries for the requested gym', async () => {
      const qb = mockQb();
      attendanceRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getClassRoster(GYM_A, 'schedule-123');

      expect(qb.where).toHaveBeenCalledWith('a.gymId = :gymId', {
        gymId: GYM_A,
      });
    });

    it('does not return roster entries from Gym B', async () => {
      const qb = mockQb();
      attendanceRepo.createQueryBuilder.mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);

      const result = await service.getClassRoster(GYM_A, 'schedule-123', '2026-04-14');

      expect(result).toEqual([]);
      // Verify gymId filter is the first where clause
      expect(qb.where).toHaveBeenCalledTimes(1);
      expect(qb.where.mock.calls[0][1]).toEqual({ gymId: GYM_A });
    });
  });
});
