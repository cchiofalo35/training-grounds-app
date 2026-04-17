import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserEntity } from '../../entities/user.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { ClassScheduleEntity } from '../../entities/class-schedule.entity';
import { QuestEntity, UserQuestEntity } from '../../entities/quest.entity';
import { CourseEntity, CourseModuleEntity } from '../../entities/course.entity';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { JournalCommentEntity } from '../../entities/journal-comment.entity';

const GYM_A = 'gym-a-uuid';
const GYM_B = 'gym-b-uuid';
const USER_ID = 'user-uuid';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn((entity: any) => {
    if (Array.isArray(entity)) return Promise.resolve(entity.map((e: any, i: number) => ({ id: `mock-${i}`, ...e })));
    return Promise.resolve({ id: 'mock-uuid', ...entity });
  }),
  create: jest.fn((entity: any) => entity),
  count: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => {
  const qb: Record<string, jest.Mock> = {};
  qb.innerJoin = jest.fn().mockReturnValue(qb);
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.groupBy = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getRawOne = jest.fn().mockResolvedValue({ count: '0' });
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  return qb;
};

describe('AdminService — cross-tenant isolation', () => {
  let service: AdminService;
  let userRepo: ReturnType<typeof mockRepo>;
  let attendanceRepo: ReturnType<typeof mockRepo>;
  let badgeRepo: ReturnType<typeof mockRepo>;
  let userBadgeRepo: ReturnType<typeof mockRepo>;
  let classRepo: ReturnType<typeof mockRepo>;
  let questRepo: ReturnType<typeof mockRepo>;
  let userQuestRepo: ReturnType<typeof mockRepo>;
  let courseRepo: ReturnType<typeof mockRepo>;
  let moduleRepo: ReturnType<typeof mockRepo>;
  let journalRepo: ReturnType<typeof mockRepo>;
  let journalCommentRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    userRepo = mockRepo();
    attendanceRepo = mockRepo();
    badgeRepo = mockRepo();
    userBadgeRepo = mockRepo();
    classRepo = mockRepo();
    questRepo = mockRepo();
    userQuestRepo = mockRepo();
    courseRepo = mockRepo();
    moduleRepo = mockRepo();
    journalRepo = mockRepo();
    journalCommentRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(AttendanceRecordEntity), useValue: attendanceRepo },
        { provide: getRepositoryToken(BadgeEntity), useValue: badgeRepo },
        { provide: getRepositoryToken(UserBadgeEntity), useValue: userBadgeRepo },
        { provide: getRepositoryToken(ClassScheduleEntity), useValue: classRepo },
        { provide: getRepositoryToken(QuestEntity), useValue: questRepo },
        { provide: getRepositoryToken(UserQuestEntity), useValue: userQuestRepo },
        { provide: getRepositoryToken(CourseEntity), useValue: courseRepo },
        { provide: getRepositoryToken(CourseModuleEntity), useValue: moduleRepo },
        { provide: getRepositoryToken(JournalEntryEntity), useValue: journalRepo },
        { provide: getRepositoryToken(JournalCommentEntity), useValue: journalCommentRepo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // ==================== Members ====================

  it('getMembers returns only members of the requested gym (verifies QB where clause)', async () => {
    const qb = mockQueryBuilder();
    const gymAMembers = [{ id: 'user-1', name: 'Alice' }];
    qb.getManyAndCount.mockResolvedValue([gymAMembers, 1]);
    userRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getMembers(GYM_A);

    expect(qb.where).toHaveBeenCalledWith('gm.gymId = :gymId', { gymId: GYM_A });
    expect(result.members).toEqual(gymAMembers);
    expect(result.total).toBe(1);
  });

  it('getMember throws NotFoundException when user is member of Gym A but queried from Gym B', async () => {
    const qb = mockQueryBuilder();
    qb.getOne.mockResolvedValue(null); // Not found in Gym B
    userRepo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.getMember(GYM_B, 'user-in-gym-a')).rejects.toThrow(NotFoundException);

    expect(qb.where).toHaveBeenCalledWith('gm.gymId = :gymId', { gymId: GYM_B });
    expect(qb.andWhere).toHaveBeenCalledWith('u.id = :id', { id: 'user-in-gym-a' });
  });

  // ==================== Classes ====================

  it('getClasses returns only classes for the requested gym', async () => {
    const gymAClasses = [
      { id: 'class-1', gymId: GYM_A, name: 'BJJ Fundamentals' },
    ];
    classRepo.find.mockResolvedValue(gymAClasses);

    const result = await service.getClasses(GYM_A);

    expect(classRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A },
      relations: ['instructor'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    expect(result).toEqual(gymAClasses);
  });

  it('updateClass throws NotFoundException when class belongs to a different gym', async () => {
    classRepo.findOne.mockResolvedValue(null); // Not found in Gym B

    await expect(
      service.updateClass(GYM_B, 'class-in-gym-a', { name: 'Hacked Class' }),
    ).rejects.toThrow(NotFoundException);

    expect(classRepo.findOne).toHaveBeenCalledWith({ where: { id: 'class-in-gym-a', gymId: GYM_B } });
    expect(classRepo.save).not.toHaveBeenCalled();
  });

  it('createClass saves with the correct gymId', async () => {
    const dto = { name: 'Muay Thai', dayOfWeek: 1, startTime: '18:00', endTime: '19:00' };

    await service.createClass(GYM_A, dto as any);

    expect(classRepo.create).toHaveBeenCalledWith(expect.objectContaining({ gymId: GYM_A }));
    expect(classRepo.save).toHaveBeenCalled();
  });

  // ==================== Badges ====================

  it('getBadges returns only gym-scoped badges', async () => {
    const gymABadges = [{ id: 'badge-1', gymId: GYM_A, name: 'Iron Will' }];
    badgeRepo.find.mockResolvedValue(gymABadges);

    const result = await service.getBadges(GYM_A);

    expect(badgeRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(gymABadges);
  });

  it('updateBadge throws NotFoundException for cross-gym badge', async () => {
    badgeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateBadge(GYM_B, 'badge-in-gym-a', { name: 'Hacked Badge' }),
    ).rejects.toThrow(NotFoundException);

    expect(badgeRepo.findOne).toHaveBeenCalledWith({ where: { id: 'badge-in-gym-a', gymId: GYM_B } });
    expect(badgeRepo.save).not.toHaveBeenCalled();
  });

  // ==================== Quests ====================

  it('getQuests returns only gym-scoped quests', async () => {
    const gymAQuests = [{ id: 'quest-1', gymId: GYM_A, name: 'Weekly Challenge' }];
    questRepo.find.mockResolvedValue(gymAQuests);

    const result = await service.getQuests(GYM_A);

    expect(questRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(gymAQuests);
  });

  // ==================== Courses ====================

  it('getCourses returns only gym-scoped courses', async () => {
    const gymACourses = [{ id: 'course-1', gymId: GYM_A, title: 'BJJ Basics' }];
    courseRepo.find.mockResolvedValue(gymACourses);

    const result = await service.getCourses(GYM_A);

    expect(courseRepo.find).toHaveBeenCalledWith({
      where: { gymId: GYM_A },
      relations: ['modules'],
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(gymACourses);
  });

  // ==================== Analytics ====================

  it('getOverview analytics count only gym-scoped data', async () => {
    // Setup user query builder for totalMembers
    const userQb = mockQueryBuilder();
    userQb.getCount.mockResolvedValueOnce(10); // totalMembers
    userQb.getCount.mockResolvedValueOnce(3);  // newMembersThisMonth
    userRepo.createQueryBuilder.mockReturnValue(userQb);

    // Setup attendance query builder for activeMembers
    const attendanceQb = mockQueryBuilder();
    attendanceQb.getRawOne.mockResolvedValue({ count: '7' });
    attendanceRepo.createQueryBuilder.mockReturnValue(attendanceQb);

    // Setup attendance count for checkIns
    attendanceRepo.count.mockResolvedValueOnce(25); // checkInsThisWeek
    attendanceRepo.count.mockResolvedValueOnce(80); // checkInsThisMonth

    const result = await service.getOverview(GYM_A);

    // Verify user QB scopes to gymId
    expect(userQb.where).toHaveBeenCalledWith('gm.gymId = :gymId', { gymId: GYM_A });

    // Verify attendance QB scopes to gymId
    expect(attendanceQb.where).toHaveBeenCalledWith('a.gymId = :gymId', { gymId: GYM_A });

    // Verify attendance count includes gymId
    expect(attendanceRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gymId: GYM_A }),
      }),
    );

    expect(result).toEqual({
      totalMembers: 10,
      activeMembers: 7,
      newMembersThisMonth: 3,
      checkInsThisWeek: 25,
      checkInsThisMonth: 80,
    });
  });

  // ==================== Journal Feed ====================

  it('getJournalFeed returns only gym-scoped journal entries', async () => {
    const qb = mockQueryBuilder();
    qb.getCount.mockResolvedValue(1);
    qb.getMany.mockResolvedValue([
      {
        id: 'entry-1',
        gymId: GYM_A,
        userId: USER_ID,
        exploration: 'Sweeps',
        challenge: 'Balance',
        worked: 'Passing',
        takeaways: 'Stay low',
        nextSession: 'Half guard',
        className: 'BJJ',
        discipline: 'bjj',
        isSharedWithCoach: true,
        createdAt: new Date(),
        user: { name: 'Alex', beltRank: 'blue' },
      },
    ]);
    journalRepo.createQueryBuilder.mockReturnValue(qb);

    // Mock comments query builder
    const commentQb = mockQueryBuilder();
    commentQb.getMany.mockResolvedValue([]);
    journalCommentRepo.createQueryBuilder.mockReturnValue(commentQb);

    const result = await service.getJournalFeed(GYM_A, 1, 20, true);

    expect(qb.where).toHaveBeenCalledWith('j.gymId = :gymId', { gymId: GYM_A });
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('addJournalComment throws NotFoundException when journal entry belongs to a different gym', async () => {
    journalRepo.findOne.mockResolvedValue(null); // Entry not found in Gym B

    await expect(
      service.addJournalComment(GYM_B, 'entry-in-gym-a', 'coach-id', 'Great progress!'),
    ).rejects.toThrow(NotFoundException);

    expect(journalRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'entry-in-gym-a', gymId: GYM_B },
    });
    expect(journalCommentRepo.save).not.toHaveBeenCalled();
  });

  it('createBadge saves with the correct gymId', async () => {
    const dto = { name: 'Warrior', description: 'Attend 5 classes', category: 'attendance' };

    await service.createBadge(GYM_A, dto as any);

    expect(badgeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ gymId: GYM_A }));
    expect(badgeRepo.save).toHaveBeenCalled();
  });
});
