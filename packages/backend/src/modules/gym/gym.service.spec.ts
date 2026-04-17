import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GymService } from './gym.service';
import { GymEntity, GymMembershipEntity } from '../../entities/gym.entity';
import { UserEntity } from '../../entities/user.entity';
import { ChannelEntity } from '../../entities/channel.entity';
import { BadgeEntity } from '../../entities/badge.entity';
import { QuestEntity } from '../../entities/quest.entity';

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn((entity: any) => {
    if (Array.isArray(entity)) {
      return Promise.resolve(entity.map((e: any, i: number) => ({ id: `mock-${i}`, ...e })));
    }
    return Promise.resolve({ id: 'mock-uuid', ...entity });
  }),
  create: jest.fn((entity: any) => entity),
  count: jest.fn(),
});

const createMockManager = () => {
  const repos: Record<string, ReturnType<typeof mockRepo>> = {};
  return {
    getRepository: jest.fn((entity: unknown) => {
      const name = (entity as { name?: string })?.name ?? String(entity);
      if (!repos[name]) repos[name] = mockRepo();
      return repos[name];
    }),
    repos,
  };
};

describe('GymService', () => {
  let service: GymService;
  let gymRepo: ReturnType<typeof mockRepo>;
  let membershipRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let mockManager: ReturnType<typeof createMockManager>;
  let mockDataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    gymRepo = mockRepo();
    membershipRepo = mockRepo();
    userRepo = mockRepo();
    mockManager = createMockManager();
    mockDataSource = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GymService,
        { provide: getRepositoryToken(GymEntity), useValue: gymRepo },
        { provide: getRepositoryToken(GymMembershipEntity), useValue: membershipRepo },
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<GymService>(GymService);
  });

  describe('generateSlug', () => {
    it('converts name to lowercase hyphenated slug', () => {
      expect(service.generateSlug('Iron Lion MMA')).toBe('iron-lion-mma');
    });

    it('strips special characters', () => {
      expect(service.generateSlug('Gym @#$ Name!!!')).toBe('gym-name');
    });

    it('handles multiple spaces', () => {
      expect(service.generateSlug('  My   Gym  ')).toBe('my-gym');
    });
  });

  describe('ensureUniqueSlug', () => {
    it('returns slug as-is when not taken', async () => {
      gymRepo.findOne.mockResolvedValue(null);
      const result = await service.ensureUniqueSlug('iron-lion-mma');
      expect(result).toBe('iron-lion-mma');
    });

    it('appends suffix when slug exists', async () => {
      gymRepo.findOne.mockResolvedValue({ id: 'existing', slug: 'iron-lion-mma' });
      const result = await service.ensureUniqueSlug('iron-lion-mma');
      expect(result).toMatch(/^iron-lion-mma-[a-z0-9]{4}$/);
    });
  });

  describe('onboardGym', () => {
    const dto = {
      name: 'Iron Lion MMA',
      ownerEmail: 'owner@test.com',
      plan: 'pro' as const,
    };

    it('throws NotFoundException when owner email not found', async () => {
      const userRepoMock = mockManager.repos[UserEntity.name] ?? mockRepo();
      mockManager.getRepository.mockImplementation((entity: unknown) => {
        const name = (entity as { name?: string })?.name ?? '';
        if (name === 'UserEntity') return { ...userRepoMock, findOne: jest.fn().mockResolvedValue(null) };
        return mockRepo();
      });

      await expect(service.onboardGym(dto)).rejects.toThrow(NotFoundException);
    });

    it('creates gym with correct defaults and returns summary', async () => {
      const owner = { id: 'owner-id', email: 'owner@test.com', name: 'Owner' };
      const savedGym = { id: 'gym-id', slug: 'iron-lion-mma', name: 'Iron Lion MMA' };

      const mgr = createMockManager();
      const gymRepoMock = mockRepo();
      gymRepoMock.findOne.mockResolvedValue(null); // slug not taken
      gymRepoMock.save.mockResolvedValue(savedGym as any);

      const userRepoMock = mockRepo();
      userRepoMock.findOne.mockResolvedValue(owner);

      mgr.getRepository.mockImplementation((entity: unknown) => {
        const name = (entity as { name?: string })?.name ?? '';
        if (name === 'UserEntity') return userRepoMock;
        if (name === 'GymEntity') return gymRepoMock;
        return mockRepo();
      });

      mockDataSource.transaction.mockImplementation((cb: any) => cb(mgr));

      const result = await service.onboardGym(dto);

      expect(result.gym.id).toBe('gym-id');
      expect(result.summary.slug).toBe('iron-lion-mma');
      expect(result.summary.channelsCreated).toBe(8);
      expect(result.summary.badgesCreated).toBe(9);
      expect(result.summary.questsCreated).toBe(3);
      expect(result.summary.ownerMembershipCreated).toBe(true);
    });

    it('uses transaction for atomicity', async () => {
      const owner = { id: 'owner-id', email: 'owner@test.com' };
      const mgr = createMockManager();
      const gymRepoMock = mockRepo();
      gymRepoMock.findOne.mockResolvedValue(null);
      gymRepoMock.save.mockResolvedValue({ id: 'g', slug: 'iron-lion-mma' } as any);
      const userRepoMock = mockRepo();
      userRepoMock.findOne.mockResolvedValue(owner);

      mgr.getRepository.mockImplementation((entity: unknown) => {
        const name = (entity as { name?: string })?.name ?? '';
        if (name === 'UserEntity') return userRepoMock;
        if (name === 'GymEntity') return gymRepoMock;
        return mockRepo();
      });
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mgr));

      await service.onboardGym(dto);
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns gym when found', async () => {
      const gym = { id: 'gym-id', name: 'Test Gym' };
      gymRepo.findOne.mockResolvedValue(gym);
      const result = await service.findById('gym-id');
      expect(result).toEqual(gym);
    });

    it('throws NotFoundException when not found', async () => {
      gymRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('returns gym when found', async () => {
      const gym = { id: 'gym-id', slug: 'test-gym' };
      gymRepo.findOne.mockResolvedValue(gym);
      const result = await service.findBySlug('test-gym');
      expect(result).toEqual(gym);
    });

    it('throws NotFoundException when not found', async () => {
      gymRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('no-gym')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated gyms', async () => {
      const gyms = [{ id: '1' }, { id: '2' }];
      gymRepo.findAndCount.mockResolvedValue([gyms, 2]);
      const result = await service.findAll(1, 20);
      expect(result.gyms).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('update', () => {
    it('updates provided fields', async () => {
      const gym = { id: 'gym-id', name: 'Old Name', slug: 'old-name', primaryColor: '#000' };
      gymRepo.findOne.mockResolvedValue(gym);
      gymRepo.save.mockImplementation((g: any) => Promise.resolve(g));

      const result = await service.update('gym-id', { primaryColor: '#FFF' });
      expect(result.primaryColor).toBe('#FFF');
      expect(result.name).toBe('Old Name');
    });

    it('throws NotFoundException for invalid id', async () => {
      gymRepo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('creates membership with given role', async () => {
      membershipRepo.findOne.mockResolvedValue(null);
      membershipRepo.save.mockImplementation((m: any) => Promise.resolve({ id: 'm-id', ...m }));

      const result = await service.addMember('gym-id', 'user-id', 'coach');
      expect(result.gymId).toBe('gym-id');
      expect(result.userId).toBe('user-id');
      expect(result.role).toBe('coach');
    });

    it('throws ConflictException for duplicate membership', async () => {
      membershipRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.addMember('gym-id', 'user-id', 'member')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deactivate', () => {
    it('sets gym isActive to false', async () => {
      const gym = { id: 'gym-id', isActive: true };
      gymRepo.findOne.mockResolvedValue(gym);
      gymRepo.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.deactivate('gym-id');
      expect(gym.isActive).toBe(false);
    });
  });

  describe('getMembers', () => {
    it('returns paginated members', async () => {
      const members = [{ id: 'm1', userId: 'u1' }];
      membershipRepo.findAndCount.mockResolvedValue([members, 1]);

      const result = await service.getMembers('gym-id', 1, 20);
      expect(result.members).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
