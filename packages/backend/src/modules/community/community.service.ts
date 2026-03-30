import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as admin from 'firebase-admin';
import { ChannelEntity } from '../../entities/channel.entity';
import { ChannelMessageEntity } from '../../entities/channel-message.entity';
import { MessageReactionEntity } from '../../entities/message-reaction.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
    @InjectRepository(ChannelMessageEntity)
    private readonly messageRepo: Repository<ChannelMessageEntity>,
    @InjectRepository(MessageReactionEntity)
    private readonly reactionRepo: Repository<MessageReactionEntity>,
  ) {}

  // ===== Channels =====

  async getChannels(): Promise<ChannelEntity[]> {
    return this.channelRepo.find({
      where: { isArchived: false },
      order: { isPinned: 'DESC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getChannel(id: string): Promise<ChannelEntity> {
    const channel = await this.channelRepo.findOne({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async createChannel(dto: Partial<ChannelEntity>): Promise<ChannelEntity> {
    const entity = this.channelRepo.create(dto);
    return this.channelRepo.save(entity);
  }

  async updateChannel(id: string, dto: Partial<ChannelEntity>): Promise<ChannelEntity> {
    const entity = await this.getChannel(id);
    Object.assign(entity, dto);
    return this.channelRepo.save(entity);
  }

  async archiveChannel(id: string): Promise<void> {
    const entity = await this.getChannel(id);
    entity.isArchived = true;
    await this.channelRepo.save(entity);
  }

  // ===== Messages =====

  async getMessages(
    channelId: string,
    cursor?: string,
    limit = 50,
  ): Promise<{ messages: any[]; hasMore: boolean }> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.channelId = :channelId', { channelId })
      .andWhere('m.isDeleted = false')
      .andWhere('m.parentId IS NULL') // Only top-level messages
      .orderBy('m.createdAt', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const cursorMsg = await this.messageRepo.findOne({ where: { id: cursor } });
      if (cursorMsg) {
        qb.andWhere('m.createdAt < :cursorDate', { cursorDate: cursorMsg.createdAt });
      }
    }

    const messages = await qb.getMany();
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Load reactions for these messages
    const messageIds = messages.map((m) => m.id);
    let reactionsMap: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {};

    if (messageIds.length > 0) {
      const reactions = await this.reactionRepo
        .createQueryBuilder('r')
        .where('r.messageId IN (:...ids)', { ids: messageIds })
        .getMany();

      // Group by messageId and emoji
      const grouped: Record<string, Record<string, string[]>> = {};
      for (const r of reactions) {
        if (!grouped[r.messageId]) grouped[r.messageId] = {};
        if (!grouped[r.messageId][r.emoji]) grouped[r.messageId][r.emoji] = [];
        grouped[r.messageId][r.emoji].push(r.userId);
      }

      for (const [msgId, emojis] of Object.entries(grouped)) {
        reactionsMap[msgId] = Object.entries(emojis).map(([emoji, userIds]) => ({
          emoji,
          count: userIds.length,
          userIds,
        }));
      }
    }

    const enriched = messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      userId: m.userId,
      userName: m.user?.name ?? 'Unknown',
      userBeltRank: (m.user as any)?.beltRank ?? 'white',
      userRole: (m.user as any)?.role ?? 'member',
      userAvatarUrl: (m.user as any)?.avatarUrl ?? null,
      content: m.content,
      mediaUrls: m.mediaUrls,
      parentId: m.parentId,
      isEdited: m.isEdited,
      isPinned: m.isPinned,
      replyCount: m.replyCount,
      reactions: reactionsMap[m.id] ?? [],
      createdAt: m.createdAt,
    }));

    return { messages: enriched.reverse(), hasMore };
  }

  async createMessage(
    channelId: string,
    userId: string,
    dto: { content: string; mediaUrls?: string[]; parentId?: string },
  ): Promise<ChannelMessageEntity> {
    // Verify channel exists
    await this.getChannel(channelId);

    const message = this.messageRepo.create({
      channelId,
      userId,
      content: dto.content,
      mediaUrls: dto.mediaUrls ?? null,
      parentId: dto.parentId ?? null,
    });

    const saved = await this.messageRepo.save(message);

    // If this is a reply, increment parent's replyCount
    if (dto.parentId) {
      await this.messageRepo.increment({ id: dto.parentId }, 'replyCount', 1);
    }

    // Load user relation for response
    const full = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    return full ?? saved;
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<ChannelMessageEntity> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.userId !== userId) throw new ForbiddenException('Cannot edit another user\'s message');

    message.content = content;
    message.isEdited = true;
    return this.messageRepo.save(message);
  }

  async deleteMessage(messageId: string, userId: string, isAdmin = false): Promise<void> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Cannot delete another user\'s message');
    }

    message.isDeleted = true;
    message.content = '';
    message.mediaUrls = null;
    await this.messageRepo.save(message);

    // Decrement parent replyCount if this was a reply
    if (message.parentId) {
      await this.messageRepo.decrement({ id: message.parentId }, 'replyCount', 1);
    }
  }

  async getReplies(messageId: string): Promise<any[]> {
    const replies = await this.messageRepo.find({
      where: { parentId: messageId, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return replies.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      userId: m.userId,
      userName: m.user?.name ?? 'Unknown',
      userBeltRank: (m.user as any)?.beltRank ?? 'white',
      userRole: (m.user as any)?.role ?? 'member',
      content: m.content,
      mediaUrls: m.mediaUrls,
      parentId: m.parentId,
      isEdited: m.isEdited,
      createdAt: m.createdAt,
    }));
  }

  // ===== Reactions =====

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    // Upsert — ignore if already exists
    try {
      await this.reactionRepo.save(
        this.reactionRepo.create({ messageId, userId, emoji }),
      );
    } catch (err: any) {
      // Unique constraint violation = already reacted, ignore
      if (err.code !== '23505') throw err;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.reactionRepo.delete({ messageId, userId, emoji });
  }

  // ===== Media Upload =====

  async getUploadUrl(
    channelId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; downloadUrl: string; filePath: string }> {
    const bucket = admin.storage().bucket();
    const filePath = `community/${channelId}/${Date.now()}-${fileName}`;
    const file = bucket.file(filePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { uploadUrl, downloadUrl, filePath };
  }

  // ===== Admin: channel message count =====

  async getChannelsWithStats(): Promise<any[]> {
    const channels = await this.getChannels();
    const counts = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.channelId', 'channelId')
      .addSelect('COUNT(*)', 'count')
      .where('m.isDeleted = false')
      .groupBy('m.channelId')
      .getRawMany();

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.channelId] = parseInt(c.count, 10);
    }

    return channels.map((ch) => ({
      ...ch,
      messageCount: countMap[ch.id] ?? 0,
    }));
  }
}
