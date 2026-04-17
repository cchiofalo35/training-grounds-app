import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CommunityService } from './community.service';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ===== Channels =====

  @Get('channels')
  async getChannels(@Request() req: AuthenticatedRequest) {
    const channels = await this.communityService.getChannels(req.gymId);
    return { success: true, data: channels };
  }

  @Get('channels/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async getChannelsWithStats(@Request() req: AuthenticatedRequest) {
    const channels = await this.communityService.getChannelsWithStats(req.gymId);
    return { success: true, data: channels };
  }

  @Post('channels')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async createChannel(
    @Request() req: AuthenticatedRequest,
    @Body() body: {
      name: string;
      description?: string;
      category?: string;
      discipline?: string;
      iconEmoji?: string;
      sortOrder?: number;
      isPinned?: boolean;
      isReadOnly?: boolean;
    },
  ) {
    const channel = await this.communityService.createChannel(req.gymId, body as any);
    return { success: true, data: channel };
  }

  @Patch('channels/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async updateChannel(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      category: string;
      discipline: string;
      iconEmoji: string;
      sortOrder: number;
      isPinned: boolean;
      isReadOnly: boolean;
    }>,
  ) {
    const channel = await this.communityService.updateChannel(req.gymId, id, body as any);
    return { success: true, data: channel };
  }

  @Delete('channels/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async archiveChannel(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.communityService.archiveChannel(req.gymId, id);
    return { success: true };
  }

  // ===== Messages =====

  @Get('channels/:channelId/messages')
  async getMessages(
    @Param('channelId') channelId: string,
    @Request() req: AuthenticatedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.communityService.getMessages(
      req.gymId,
      channelId,
      cursor,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data: result };
  }

  @Post('channels/:channelId/messages')
  async createMessage(
    @Param('channelId') channelId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { content: string; mediaUrls?: string[]; parentId?: string },
  ) {
    const message = await this.communityService.createMessage(req.gymId, channelId, req.user.id, body);
    return { success: true, data: message };
  }

  @Patch('messages/:id')
  async editMessage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { content: string },
  ) {
    const message = await this.communityService.editMessage(req.gymId, id, req.user.id, body.content);
    return { success: true, data: message };
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'coach';
    await this.communityService.deleteMessage(req.gymId, id, req.user.id, isAdmin);
    return { success: true };
  }

  @Get('messages/:id/replies')
  async getReplies(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const replies = await this.communityService.getReplies(req.gymId, id);
    return { success: true, data: replies };
  }

  // ===== Reactions =====

  @Post('messages/:id/reactions')
  async addReaction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { emoji: string },
  ) {
    await this.communityService.addReaction(req.gymId, id, req.user.id, body.emoji);
    return { success: true };
  }

  @Delete('messages/:id/reactions/:emoji')
  async removeReaction(
    @Param('id') id: string,
    @Param('emoji') emoji: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.communityService.removeReaction(req.gymId, id, req.user.id, emoji);
    return { success: true };
  }

  // ===== Media Upload =====

  @Post('upload-url')
  async getUploadUrl(
    @Request() req: AuthenticatedRequest,
    @Body() body: { fileName: string; contentType: string; channelId: string },
  ) {
    const result = await this.communityService.getUploadUrl(
      req.gymId,
      body.channelId,
      body.fileName,
      body.contentType,
    );
    return { success: true, data: result };
  }
}
