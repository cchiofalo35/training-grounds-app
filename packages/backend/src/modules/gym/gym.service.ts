import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { GymEntity, GymMembershipEntity } from '../../entities/gym.entity';
import { UserEntity } from '../../entities/user.entity';
import { ChannelEntity } from '../../entities/channel.entity';
import { BadgeEntity } from '../../entities/badge.entity';
import { QuestEntity } from '../../entities/quest.entity';
import type { Discipline, BadgeCategory } from '@training-grounds/shared';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';

export interface OnboardingSummary {
  gymId: string;
  slug: string;
  channelsCreated: number;
  badgesCreated: number;
  questsCreated: number;
  ownerMembershipCreated: boolean;
}

const DEFAULT_CHANNELS: Array<{
  name: string;
  category: string;
  discipline: Discipline | null;
  iconEmoji: string;
  isPinned: boolean;
  isReadOnly: boolean;
  sortOrder: number;
}> = [
  { name: 'announcements', category: 'announcements', discipline: null, iconEmoji: '📢', isPinned: true, isReadOnly: true, sortOrder: 0 },
  { name: 'general', category: 'general', discipline: null, iconEmoji: '💬', isPinned: false, isReadOnly: false, sortOrder: 1 },
  { name: 'introductions', category: 'general', discipline: null, iconEmoji: '👋', isPinned: false, isReadOnly: false, sortOrder: 2 },
  { name: 'bjj', category: 'discipline', discipline: 'bjj-gi', iconEmoji: '🥋', isPinned: false, isReadOnly: false, sortOrder: 3 },
  { name: 'muay-thai', category: 'discipline', discipline: 'muay-thai', iconEmoji: '🥊', isPinned: false, isReadOnly: false, sortOrder: 4 },
  { name: 'open-mat', category: 'training', discipline: null, iconEmoji: '🤼', isPinned: false, isReadOnly: false, sortOrder: 5 },
  { name: 'competition', category: 'training', discipline: null, iconEmoji: '🏆', isPinned: false, isReadOnly: false, sortOrder: 6 },
  { name: 'highlights', category: 'media', discipline: null, iconEmoji: '🎥', isPinned: false, isReadOnly: false, sortOrder: 7 },
];

const DEFAULT_BADGES: Array<{
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  criteriaJson: Record<string, unknown>;
  isHidden: boolean;
}> = [
  { name: 'First Class', description: 'Attended your first class', iconUrl: '/badges/first-class.png', category: 'attendance', criteriaJson: { type: 'attendance_count', threshold: 1 }, isHidden: false },
  { name: '7-Day Warrior', description: '7-day training streak', iconUrl: '/badges/7-day-streak.png', category: 'attendance', criteriaJson: { type: 'streak', threshold: 7 }, isHidden: false },
  { name: 'Iron Will', description: '30-day training streak', iconUrl: '/badges/iron-will.png', category: 'attendance', criteriaJson: { type: 'streak', threshold: 30 }, isHidden: false },
  { name: 'Centurion', description: '100 consecutive training days', iconUrl: '/badges/centurion.png', category: 'attendance', criteriaJson: { type: 'streak', threshold: 100 }, isHidden: false },
  { name: 'BJJ Explorer', description: 'Complete 10 BJJ classes', iconUrl: '/badges/bjj-explorer.png', category: 'discipline', criteriaJson: { type: 'discipline_count', discipline: 'bjj-gi', threshold: 10 }, isHidden: false },
  { name: 'Striker', description: 'Complete 10 Muay Thai classes', iconUrl: '/badges/striker.png', category: 'discipline', criteriaJson: { type: 'discipline_count', discipline: 'muay-thai', threshold: 10 }, isHidden: false },
  { name: 'MMA Generalist', description: 'Attend 10 classes each in BJJ, Muay Thai, and MMA', iconUrl: '/badges/mma-generalist.png', category: 'discipline', criteriaJson: { type: 'multi_discipline', disciplines: ['bjj-gi', 'muay-thai', 'mma'], threshold: 10 }, isHidden: false },
  { name: 'Midnight Warrior', description: 'Check in after 10 PM', iconUrl: '/badges/midnight-warrior.png', category: 'secret', criteriaJson: { type: 'custom', key: 'late_checkin_22' }, isHidden: true },
  { name: 'Comeback Kid', description: 'Recover from 0 to a 30-day streak', iconUrl: '/badges/comeback-kid.png', category: 'secret', criteriaJson: { type: 'custom', key: 'comeback_30' }, isHidden: true },
];

const DEFAULT_QUESTS: Array<{
  name: string;
  description: string;
  type: string;
  criteriaJson: Record<string, unknown>;
  xpReward: number;
}> = [
  { name: 'Weekly Warrior', description: 'Attend 3 classes this week', type: 'weekly', criteriaJson: { type: 'attendance_count', threshold: 3, period: 'week' }, xpReward: 100 },
  { name: 'Monthly Grinder', description: 'Attend 12 classes this month', type: 'monthly', criteriaJson: { type: 'attendance_count', threshold: 12, period: 'month' }, xpReward: 300 },
  { name: 'Cross-Train', description: 'Train in at least 2 different disciplines this week', type: 'weekly', criteriaJson: { type: 'discipline_variety', threshold: 2, period: 'week' }, xpReward: 75 },
];

@Injectable()
export class GymService {
  constructor(
    @InjectRepository(GymEntity)
    private readonly gymRepo: Repository<GymEntity>,
    @InjectRepository(GymMembershipEntity)
    private readonly membershipRepo: Repository<GymMembershipEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onboardGym(dto: CreateGymDto): Promise<{ gym: GymEntity; summary: OnboardingSummary }> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const gymRepo = manager.getRepository(GymEntity);
      const membershipRepo = manager.getRepository(GymMembershipEntity);
      const channelRepo = manager.getRepository(ChannelEntity);
      const badgeRepo = manager.getRepository(BadgeEntity);
      const questRepo = manager.getRepository(QuestEntity);

      // 1. Find owner by email
      const owner = await userRepo.findOne({ where: { email: dto.ownerEmail } });
      if (!owner) {
        throw new NotFoundException(`User with email ${dto.ownerEmail} not found`);
      }

      // 2. Generate unique slug
      const slug = await this.ensureUniqueSlug(this.generateSlug(dto.name), manager);

      // 3. Create gym
      const gym = gymRepo.create({
        name: dto.name,
        slug,
        ownerId: owner.id,
        logoUrl: dto.logoUrl ?? null,
        primaryColor: dto.primaryColor ?? '#C9A87C',
        secondaryColor: dto.secondaryColor ?? '#1E1E1E',
        headingFont: dto.headingFont ?? 'Bebas Neue',
        bodyFont: dto.bodyFont ?? 'Inter',
        timezone: dto.timezone ?? 'America/New_York',
        currency: dto.currency ?? 'USD',
        plan: dto.plan,
        referralProgramEnabled: dto.plan !== 'starter',
        communityEnabled: true,
        streakFreezeEnabled: true,
        maxStreakFreezesPerMonth: 2,
        isActive: true,
        address: dto.address ?? null,
        city: dto.city ?? null,
      });
      const savedGym = await gymRepo.save(gym);

      // 4. Create owner membership
      const membership = membershipRepo.create({
        gymId: savedGym.id,
        userId: owner.id,
        role: 'owner',
        isActive: true,
      });
      await membershipRepo.save(membership);

      // 5. Create default channels
      const channels = DEFAULT_CHANNELS.map((ch) =>
        channelRepo.create({ ...ch, gymId: savedGym.id }),
      );
      await channelRepo.save(channels);

      // 6. Create default badges
      const badges = DEFAULT_BADGES.map((b) =>
        badgeRepo.create({ ...b, gymId: savedGym.id }),
      );
      await badgeRepo.save(badges);

      // 7. Create default quests
      const quests = DEFAULT_QUESTS.map((q) =>
        questRepo.create({ ...q, gymId: savedGym.id, isActive: true }),
      );
      await questRepo.save(quests);

      // TODO: Redis cache warm-up (gym:{id}:config) when Redis service is available

      return {
        gym: savedGym,
        summary: {
          gymId: savedGym.id,
          slug: savedGym.slug,
          channelsCreated: channels.length,
          badgesCreated: badges.length,
          questsCreated: quests.length,
          ownerMembershipCreated: true,
        },
      };
    });
  }

  async findById(id: string): Promise<GymEntity> {
    const gym = await this.gymRepo.findOne({ where: { id } });
    if (!gym) {
      throw new NotFoundException(`Gym with id ${id} not found`);
    }
    return gym;
  }

  async findBySlug(slug: string): Promise<GymEntity> {
    const gym = await this.gymRepo.findOne({ where: { slug } });
    if (!gym) {
      throw new NotFoundException(`Gym with slug ${slug} not found`);
    }
    return gym;
  }

  async findAll(page: number, perPage: number): Promise<{ gyms: GymEntity[]; total: number }> {
    const [gyms, total] = await this.gymRepo.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { gyms, total };
  }

  async update(id: string, dto: UpdateGymDto): Promise<GymEntity> {
    const gym = await this.findById(id);

    if (dto.name && dto.name !== gym.name) {
      gym.slug = await this.ensureUniqueSlug(this.generateSlug(dto.name));
    }

    Object.assign(gym, dto);
    return this.gymRepo.save(gym);
  }

  async deactivate(id: string): Promise<void> {
    const gym = await this.findById(id);
    gym.isActive = false;
    await this.gymRepo.save(gym);
  }

  async getMembers(
    gymId: string,
    page: number,
    perPage: number,
  ): Promise<{ members: GymMembershipEntity[]; total: number }> {
    const [members, total] = await this.membershipRepo.findAndCount({
      where: { gymId, isActive: true },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { members, total };
  }

  async addMember(gymId: string, userId: string, role: string): Promise<GymMembershipEntity> {
    const existing = await this.membershipRepo.findOne({
      where: { gymId, userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this gym');
    }

    const membership = this.membershipRepo.create({
      gymId,
      userId,
      role,
      isActive: true,
    });
    return this.membershipRepo.save(membership);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async ensureUniqueSlug(slug: string, manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(GymEntity) : this.gymRepo;
    const existing = await repo.findOne({ where: { slug } });
    if (!existing) {
      return slug;
    }
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
  }
}
