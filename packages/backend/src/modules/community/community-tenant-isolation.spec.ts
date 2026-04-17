import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommunityService } from './community.service';
import { ChannelEntity } from '../../entities/channel.entity';
import { ChannelMessageEntity } from '../../entities/channel-message.entity';
import { MessageReactionEntity } from '../../entities/message-reaction.entity';

/* eslint-disable @typescript-eslint/no-explicit-any */

const GYM_A = 'gym-a-uuid';
const GYM_B = 'gym-b-uuid';
const USER_ID = 'user-uuid';
const CHANNEL_ID = 'channel-uuid';
const MESSAGE_ID = 'message-uuid';

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
  delete: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getRawMany: jest.fn().mockResolvedValue([]),
});

describe('CommunityService — tenant isolation', () => {
  let service: CommunityService;
  let channelRepo: ReturnType<typeof mockRepo>;
  let messageRepo: ReturnType<typeof mockRepo>;
  let reactionRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    channelRepo = mockRepo();
    messageRepo = mockRepo();
    reactionRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: getRepositoryToken(ChannelEntity), useValue: channelRepo },
        { provide: getRepositoryToken(ChannelMessageEntity), useValue: messageRepo },
        { provide: getRepositoryToken(MessageReactionEntity), useValue: reactionRepo },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  describe('getChannels', () => {
    it('returns only channels belonging to the requested gym', async () => {
      const gymAChannels = [
        { id: 'ch-1', name: 'general', gymId: GYM_A, isArchived: false },
        { id: 'ch-2', name: 'bjj', gymId: GYM_A, isArchived: false },
      ];
      channelRepo.find.mockResolvedValue(gymAChannels);

      const result = await service.getChannels(GYM_A);

      expect(channelRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, isArchived: false },
        }),
      );
      expect(result).toEqual(gymAChannels);
    });

    it('passes gymId in the where clause so Gym B cannot see Gym A channels', async () => {
      channelRepo.find.mockResolvedValue([]);

      await service.getChannels(GYM_B);

      expect(channelRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_B, isArchived: false },
        }),
      );
    });
  });

  describe('getChannel', () => {
    it('throws NotFoundException when channel exists in Gym A but queried from Gym B', async () => {
      // Channel exists in Gym A but query uses Gym B — findOne returns null
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.getChannel(GYM_B, CHANNEL_ID)).rejects.toThrow(NotFoundException);

      expect(channelRepo.findOne).toHaveBeenCalledWith({
        where: { id: CHANNEL_ID, gymId: GYM_B },
      });
    });

    it('returns the channel when gymId matches', async () => {
      const channel = { id: CHANNEL_ID, gymId: GYM_A, name: 'general' };
      channelRepo.findOne.mockResolvedValue(channel);

      const result = await service.getChannel(GYM_A, CHANNEL_ID);

      expect(result).toEqual(channel);
      expect(channelRepo.findOne).toHaveBeenCalledWith({
        where: { id: CHANNEL_ID, gymId: GYM_A },
      });
    });
  });

  describe('createChannel', () => {
    it('creates channel scoped to the correct gym', async () => {
      const dto = { name: 'general', description: 'Main chat' };
      channelRepo.create.mockReturnValue({ ...dto, gymId: GYM_A });
      channelRepo.save.mockResolvedValue({ id: 'new-ch', ...dto, gymId: GYM_A });

      const result = await service.createChannel(GYM_A, dto);

      expect(channelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gymId: GYM_A }),
      );
      expect(result.gymId).toBe(GYM_A);
    });

    it('does not leak gymId from dto — always uses the gymId parameter', async () => {
      const dto = { name: 'sneaky', gymId: GYM_B } as any;
      channelRepo.create.mockImplementation((entity: any) => entity);
      channelRepo.save.mockImplementation((entity: any) =>
        Promise.resolve({ id: 'new-ch', ...entity }),
      );

      const result = await service.createChannel(GYM_A, dto);

      // The spread { ...dto, gymId } means gymId parameter wins
      expect(channelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gymId: GYM_A }),
      );
      expect(result.gymId).toBe(GYM_A);
    });
  });

  describe('getMessages', () => {
    it('returns empty when channel belongs to different gym', async () => {
      // getChannel call will fail because channel does not belong to GYM_B
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.getMessages(GYM_B, CHANNEL_ID)).rejects.toThrow(NotFoundException);

      expect(channelRepo.findOne).toHaveBeenCalledWith({
        where: { id: CHANNEL_ID, gymId: GYM_B },
      });
    });

    it('includes gymId in the message query builder', async () => {
      const channel = { id: CHANNEL_ID, gymId: GYM_A, name: 'general' };
      channelRepo.findOne.mockResolvedValue(channel);

      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([]);
      messageRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getMessages(GYM_A, CHANNEL_ID);

      expect(mockQb.andWhere).toHaveBeenCalledWith('m.gymId = :gymId', { gymId: GYM_A });
    });
  });

  describe('createMessage', () => {
    it('rejects message creation when channel belongs to different gym', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createMessage(GYM_B, CHANNEL_ID, USER_ID, { content: 'Hello!' }),
      ).rejects.toThrow(NotFoundException);

      expect(channelRepo.findOne).toHaveBeenCalledWith({
        where: { id: CHANNEL_ID, gymId: GYM_B },
      });
    });

    it('stamps the message with the correct gymId', async () => {
      const channel = { id: CHANNEL_ID, gymId: GYM_A, name: 'general' };
      channelRepo.findOne.mockResolvedValue(channel);
      messageRepo.create.mockImplementation((entity: any) => entity);
      messageRepo.save.mockImplementation((entity: any) =>
        Promise.resolve({ id: 'msg-1', ...entity }),
      );
      messageRepo.findOne.mockResolvedValue({
        id: 'msg-1',
        gymId: GYM_A,
        channelId: CHANNEL_ID,
        userId: USER_ID,
        content: 'Hello!',
        user: { name: 'Test User' },
      });

      await service.createMessage(GYM_A, CHANNEL_ID, USER_ID, { content: 'Hello!' });

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gymId: GYM_A }),
      );
    });
  });

  describe('editMessage', () => {
    it('throws NotFoundException when message exists in Gym A but edited from Gym B', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.editMessage(GYM_B, MESSAGE_ID, USER_ID, 'updated content'),
      ).rejects.toThrow(NotFoundException);

      expect(messageRepo.findOne).toHaveBeenCalledWith({
        where: { id: MESSAGE_ID, gymId: GYM_B },
      });
    });

    it('allows editing when gymId matches', async () => {
      const message = {
        id: MESSAGE_ID,
        gymId: GYM_A,
        userId: USER_ID,
        content: 'original',
        isEdited: false,
      };
      messageRepo.findOne.mockResolvedValue(message);
      messageRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.editMessage(GYM_A, MESSAGE_ID, USER_ID, 'updated');

      expect(result.content).toBe('updated');
      expect(result.isEdited).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    it('throws NotFoundException when message exists in Gym A but deleted from Gym B', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMessage(GYM_B, MESSAGE_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);

      expect(messageRepo.findOne).toHaveBeenCalledWith({
        where: { id: MESSAGE_ID, gymId: GYM_B },
      });
    });

    it('soft-deletes when gymId matches', async () => {
      const message = {
        id: MESSAGE_ID,
        gymId: GYM_A,
        userId: USER_ID,
        content: 'to delete',
        isDeleted: false,
        parentId: null,
        mediaUrls: ['http://example.com/photo.jpg'],
      };
      messageRepo.findOne.mockResolvedValue(message);
      messageRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      await service.deleteMessage(GYM_A, MESSAGE_ID, USER_ID);

      expect(message.isDeleted).toBe(true);
      expect(message.content).toBe('');
      expect(message.mediaUrls).toBeNull();
    });
  });

  describe('getReplies', () => {
    it('returns only replies scoped to the requested gym', async () => {
      const replies = [
        { id: 'r-1', gymId: GYM_A, parentId: MESSAGE_ID, content: 'reply 1', user: { name: 'User1' } },
      ];
      messageRepo.find.mockResolvedValue(replies);

      await service.getReplies(GYM_A, MESSAGE_ID);

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, parentId: MESSAGE_ID, isDeleted: false },
        }),
      );
    });

    it('returns empty array when querying replies from wrong gym', async () => {
      messageRepo.find.mockResolvedValue([]);

      const result = await service.getReplies(GYM_B, MESSAGE_ID);

      expect(messageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_B, parentId: MESSAGE_ID, isDeleted: false },
        }),
      );
      expect(result).toEqual([]);
    });
  });

  describe('addReaction', () => {
    it('throws NotFoundException when message belongs to different gym', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addReaction(GYM_B, MESSAGE_ID, USER_ID, 'fire'),
      ).rejects.toThrow(NotFoundException);

      expect(messageRepo.findOne).toHaveBeenCalledWith({
        where: { id: MESSAGE_ID, gymId: GYM_B },
      });
    });

    it('stamps the reaction with the correct gymId', async () => {
      const message = { id: MESSAGE_ID, gymId: GYM_A };
      messageRepo.findOne.mockResolvedValue(message);
      reactionRepo.create.mockImplementation((entity: any) => entity);
      reactionRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      await service.addReaction(GYM_A, MESSAGE_ID, USER_ID, 'fire');

      expect(reactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gymId: GYM_A, messageId: MESSAGE_ID, userId: USER_ID, emoji: 'fire' }),
      );
    });
  });

  describe('removeReaction', () => {
    it('includes gymId in delete criteria', async () => {
      reactionRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeReaction(GYM_A, MESSAGE_ID, USER_ID, 'fire');

      expect(reactionRepo.delete).toHaveBeenCalledWith({
        gymId: GYM_A,
        messageId: MESSAGE_ID,
        userId: USER_ID,
        emoji: 'fire',
      });
    });

    it('does not delete reactions from a different gym', async () => {
      reactionRepo.delete.mockResolvedValue({ affected: 0 });

      await service.removeReaction(GYM_B, MESSAGE_ID, USER_ID, 'fire');

      expect(reactionRepo.delete).toHaveBeenCalledWith({
        gymId: GYM_B,
        messageId: MESSAGE_ID,
        userId: USER_ID,
        emoji: 'fire',
      });
    });
  });

  describe('getChannelsWithStats', () => {
    it('counts only messages within the requested gym', async () => {
      const gymAChannels = [
        { id: 'ch-1', name: 'general', gymId: GYM_A, isArchived: false },
      ];
      channelRepo.find.mockResolvedValue(gymAChannels);

      const mockQb = createMockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([{ channelId: 'ch-1', count: '5' }]);
      messageRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getChannelsWithStats(GYM_A);

      // Verify the channels query is gym-scoped
      expect(channelRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_A, isArchived: false },
        }),
      );

      // Verify the message count query is gym-scoped
      expect(mockQb.where).toHaveBeenCalledWith('m.gymId = :gymId', { gymId: GYM_A });

      expect(result).toEqual([
        expect.objectContaining({ id: 'ch-1', messageCount: 5 }),
      ]);
    });

    it('returns zero counts when querying as Gym B with no data', async () => {
      channelRepo.find.mockResolvedValue([]);

      const mockQb = createMockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([]);
      messageRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getChannelsWithStats(GYM_B);

      expect(channelRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: GYM_B, isArchived: false },
        }),
      );
      expect(result).toEqual([]);
    });
  });

  describe('same channel name in different gyms', () => {
    it('allows duplicate channel names across gyms', async () => {
      channelRepo.create.mockImplementation((entity: any) => entity);
      channelRepo.save.mockImplementation((entity: any) =>
        Promise.resolve({ id: `ch-${entity.gymId}`, ...entity }),
      );

      const channelA = await service.createChannel(GYM_A, { name: 'general' } as any);
      const channelB = await service.createChannel(GYM_B, { name: 'general' } as any);

      expect(channelA.gymId).toBe(GYM_A);
      expect(channelB.gymId).toBe(GYM_B);
      expect(channelA.name).toBe('general');
      expect(channelB.name).toBe('general');
      expect(channelA.id).not.toBe(channelB.id);
    });
  });
});
