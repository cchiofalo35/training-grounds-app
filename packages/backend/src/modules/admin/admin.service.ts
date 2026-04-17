import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { ClassScheduleEntity } from '../../entities/class-schedule.entity';
import { QuestEntity, UserQuestEntity } from '../../entities/quest.entity';
import { CourseEntity, CourseModuleEntity } from '../../entities/course.entity';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { JournalCommentEntity } from '../../entities/journal-comment.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    @InjectRepository(BadgeEntity)
    private readonly badgeRepo: Repository<BadgeEntity>,
    @InjectRepository(UserBadgeEntity)
    private readonly userBadgeRepo: Repository<UserBadgeEntity>,
    @InjectRepository(ClassScheduleEntity)
    private readonly classRepo: Repository<ClassScheduleEntity>,
    @InjectRepository(QuestEntity)
    private readonly questRepo: Repository<QuestEntity>,
    @InjectRepository(UserQuestEntity)
    private readonly userQuestRepo: Repository<UserQuestEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(CourseModuleEntity)
    private readonly moduleRepo: Repository<CourseModuleEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalCommentEntity)
    private readonly journalCommentRepo: Repository<JournalCommentEntity>,
  ) {}

  // ==================== Members ====================

  async getMembers(
    gymId: string,
    search?: string,
    role?: string,
    page = 1,
    perPage = 20,
    sortBy = 'joinedAt',
  ): Promise<{ members: UserEntity[]; total: number }> {
    const qb = this.userRepo.createQueryBuilder('u')
      .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
      .where('gm.gymId = :gymId', { gymId })
      .andWhere('gm.isActive = true');

    if (search) {
      qb.andWhere(
        '(u.name ILIKE :search OR u.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      qb.andWhere('u.role = :role', { role });
    }

    const allowedSorts: Record<string, string> = {
      joinedAt: 'u.joinedAt',
      name: 'u.name',
      totalXp: 'u.totalXp',
      lastActiveAt: 'u.lastActiveAt',
    };

    const orderCol = allowedSorts[sortBy] || 'u.joinedAt';
    qb.orderBy(orderCol, 'DESC');

    qb.skip((page - 1) * perPage).take(perPage);

    const [members, total] = await qb.getManyAndCount();
    return { members, total };
  }

  async getMember(gymId: string, id: string): Promise<UserEntity> {
    const user = await this.userRepo.createQueryBuilder('u')
      .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
      .where('gm.gymId = :gymId', { gymId })
      .andWhere('u.id = :id', { id })
      .leftJoinAndSelect('u.attendanceRecords', 'ar')
      .leftJoinAndSelect('u.userBadges', 'ub')
      .getOne();
    if (!user) throw new NotFoundException('Member not found');
    return user;
  }

  async updateMember(
    gymId: string,
    id: string,
    dto: { role?: string; beltRank?: string; stripes?: number },
  ): Promise<UserEntity> {
    // Verify user is a member of this gym
    await this.getMember(gymId, id);

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Member not found');

    if (dto.role !== undefined) user.role = dto.role as any;
    if (dto.beltRank !== undefined) user.beltRank = dto.beltRank as any;
    if (dto.stripes !== undefined) user.stripes = dto.stripes;

    return this.userRepo.save(user);
  }

  // ==================== Classes ====================

  async getClasses(gymId: string): Promise<ClassScheduleEntity[]> {
    return this.classRepo.find({
      where: { gymId },
      relations: ['instructor'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async createClass(gymId: string, dto: Partial<ClassScheduleEntity>): Promise<ClassScheduleEntity> {
    const entity = this.classRepo.create({ ...dto, gymId });
    return this.classRepo.save(entity);
  }

  async updateClass(gymId: string, id: string, dto: Partial<ClassScheduleEntity>): Promise<ClassScheduleEntity> {
    const entity = await this.classRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Class not found');
    Object.assign(entity, dto);
    return this.classRepo.save(entity);
  }

  async deleteClass(gymId: string, id: string): Promise<void> {
    const entity = await this.classRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Class not found');
    entity.isActive = false;
    await this.classRepo.save(entity);
  }

  // ==================== Badges ====================

  async getBadges(gymId: string): Promise<BadgeEntity[]> {
    return this.badgeRepo.find({ where: { gymId }, order: { createdAt: 'DESC' } });
  }

  async createBadge(gymId: string, dto: Partial<BadgeEntity>): Promise<BadgeEntity> {
    const entity = this.badgeRepo.create({ ...dto, gymId });
    return this.badgeRepo.save(entity);
  }

  async updateBadge(gymId: string, id: string, dto: Partial<BadgeEntity>): Promise<BadgeEntity> {
    const entity = await this.badgeRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Badge not found');
    Object.assign(entity, dto);
    return this.badgeRepo.save(entity);
  }

  async deleteBadge(gymId: string, id: string): Promise<void> {
    const entity = await this.badgeRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Badge not found');
    await this.badgeRepo.remove(entity);
  }

  // ==================== Quests ====================

  async getQuests(gymId: string): Promise<QuestEntity[]> {
    return this.questRepo.find({ where: { gymId }, order: { createdAt: 'DESC' } });
  }

  async createQuest(gymId: string, dto: Partial<QuestEntity>): Promise<QuestEntity> {
    const entity = this.questRepo.create({ ...dto, gymId });
    return this.questRepo.save(entity);
  }

  async updateQuest(gymId: string, id: string, dto: Partial<QuestEntity>): Promise<QuestEntity> {
    const entity = await this.questRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Quest not found');
    Object.assign(entity, dto);
    return this.questRepo.save(entity);
  }

  async deleteQuest(gymId: string, id: string): Promise<void> {
    const entity = await this.questRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Quest not found');
    entity.isActive = false;
    await this.questRepo.save(entity);
  }

  // ==================== Courses ====================

  async getCourses(gymId: string): Promise<CourseEntity[]> {
    return this.courseRepo.find({
      where: { gymId },
      relations: ['modules'],
      order: { createdAt: 'DESC' },
    });
  }

  async createCourse(gymId: string, dto: Partial<CourseEntity>): Promise<CourseEntity> {
    const entity = this.courseRepo.create({ ...dto, gymId });
    return this.courseRepo.save(entity);
  }

  async updateCourse(gymId: string, id: string, dto: Partial<CourseEntity>): Promise<CourseEntity> {
    const entity = await this.courseRepo.findOne({ where: { id, gymId }, relations: ['modules'] });
    if (!entity) throw new NotFoundException('Course not found');
    Object.assign(entity, dto);
    return this.courseRepo.save(entity);
  }

  async deleteCourse(gymId: string, id: string): Promise<void> {
    const entity = await this.courseRepo.findOne({ where: { id, gymId } });
    if (!entity) throw new NotFoundException('Course not found');
    await this.courseRepo.remove(entity);
  }

  async addModule(gymId: string, courseId: string, dto: Partial<CourseModuleEntity>): Promise<CourseModuleEntity> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, gymId } });
    if (!course) throw new NotFoundException('Course not found');
    const entity = this.moduleRepo.create({ ...dto, courseId });
    return this.moduleRepo.save(entity);
  }

  async updateModule(gymId: string, moduleId: string, dto: Partial<CourseModuleEntity>): Promise<CourseModuleEntity> {
    const entity = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!entity || (entity.course as any)?.gymId !== gymId) throw new NotFoundException('Module not found');
    Object.assign(entity, dto);
    return this.moduleRepo.save(entity);
  }

  async deleteModule(gymId: string, moduleId: string): Promise<void> {
    const entity = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!entity || (entity.course as any)?.gymId !== gymId) throw new NotFoundException('Module not found');
    await this.moduleRepo.remove(entity);
  }

  // ==================== Analytics ====================

  async getOverview(gymId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    checkInsThisWeek: number;
    checkInsThisMonth: number;
  }> {
    const now = new Date();

    // Total members in this gym
    const totalMembers = await this.userRepo.createQueryBuilder('u')
      .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
      .where('gm.gymId = :gymId', { gymId })
      .andWhere('gm.isActive = true')
      .getCount();

    // Active members = checked in within last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const activeMembers = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.userId)', 'count')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.checkedInAt >= :since', { since: thirtyDaysAgo })
      .getRawOne()
      .then((r) => parseInt(r?.count || '0', 10));

    // New members this month (joined the gym this month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMembersThisMonth = await this.userRepo.createQueryBuilder('u')
      .innerJoin('gym_memberships', 'gm', 'gm.userId = u.id')
      .where('gm.gymId = :gymId', { gymId })
      .andWhere('gm.joinedAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Check-ins this week (Monday-Sunday)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const checkInsThisWeek = await this.attendanceRepo.count({
      where: { gymId, checkedInAt: Between(startOfWeek, now) },
    });

    const checkInsThisMonth = await this.attendanceRepo.count({
      where: { gymId, checkedInAt: Between(startOfMonth, now) },
    });

    return {
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      checkInsThisWeek,
      checkInsThisMonth,
    };
  }

  async getAttendanceTrends(
    gymId: string,
    days = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.attendanceRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.checkedInAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('a.gymId = :gymId', { gymId })
      .andWhere('a.checkedInAt >= :since', { since })
      .groupBy("TO_CHAR(a.checkedInAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));
  }

  async getDisciplineBreakdown(gymId: string): Promise<
    Array<{ discipline: string; count: number; percentage: number }>
  > {
    const rows = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.discipline', 'discipline')
      .addSelect('COUNT(*)', 'count')
      .where('a.gymId = :gymId', { gymId })
      .groupBy('a.discipline')
      .getRawMany<{ discipline: string; count: string }>();

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    return rows.map((r) => {
      const count = parseInt(r.count, 10);
      return {
        discipline: r.discipline,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });
  }

  // ==================== Journal Feed ====================

  async getJournalFeed(
    gymId: string,
    page = 1,
    perPage = 20,
    sharedOnly = true,
  ): Promise<{ entries: any[]; total: number }> {
    const qb = this.journalRepo
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.user', 'u')
      .where('j.gymId = :gymId', { gymId })
      .orderBy('j.createdAt', 'DESC');

    if (sharedOnly) {
      qb.andWhere('j.isSharedWithCoach = :shared', { shared: true });
    }

    const total = await qb.getCount();
    const entries = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    // Load comments for each entry
    const entryIds = entries.map((e) => e.id);
    let commentsMap: Record<string, JournalCommentEntity[]> = {};

    if (entryIds.length > 0) {
      const comments = await this.journalCommentRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.author', 'a')
        .where('c.journalEntryId IN (:...ids)', { ids: entryIds })
        .orderBy('c.createdAt', 'ASC')
        .getMany();

      commentsMap = comments.reduce(
        (acc, c) => {
          if (!acc[c.journalEntryId]) acc[c.journalEntryId] = [];
          acc[c.journalEntryId].push(c);
          return acc;
        },
        {} as Record<string, JournalCommentEntity[]>,
      );
    }

    const enriched = entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.user?.name ?? 'Unknown',
      userBeltRank: e.user?.beltRank ?? 'white',
      className: e.className,
      discipline: e.discipline,
      exploration: e.exploration,
      challenge: e.challenge,
      worked: e.worked,
      takeaways: e.takeaways,
      nextSession: e.nextSession,
      isSharedWithCoach: e.isSharedWithCoach,
      createdAt: e.createdAt,
      comments: (commentsMap[e.id] ?? []).map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.author?.name ?? 'Coach',
        authorRole: c.author?.role ?? 'coach',
        content: c.content,
        createdAt: c.createdAt,
      })),
    }));

    return { entries: enriched, total };
  }

  async addJournalComment(
    gymId: string,
    journalEntryId: string,
    authorId: string,
    content: string,
  ): Promise<JournalCommentEntity> {
    const entry = await this.journalRepo.findOne({ where: { id: journalEntryId, gymId } });
    if (!entry) throw new NotFoundException('Journal entry not found');

    const comment = this.journalCommentRepo.create({
      gymId,
      journalEntryId,
      authorId,
      content,
    });

    return this.journalCommentRepo.save(comment);
  }

  async getJournalComments(gymId: string, journalEntryId: string): Promise<JournalCommentEntity[]> {
    return this.journalCommentRepo.find({
      where: { gymId, journalEntryId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  // ==================== Seed Timetable ====================

  async seedTimetable(gymId: string): Promise<{ count: number }> {
    const count = await this.classRepo.count({ where: { gymId } });
    return { count };
  }
}
