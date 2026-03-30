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

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ===== Channels =====

  @Get('channels')
  async getChannels() {
    const channels = await this.communityService.getChannels();
    return { success: true, data: channels };
  }

  @Get('channels/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async getChannelsWithStats() {
    const channels = await this.communityService.getChannelsWithStats();
    return { success: true, data: channels };
  }

  @Post('channels')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async createChannel(@Body() body: {
    name: string;
    description?: string;
    category?: string;
    discipline?: string;
    iconEmoji?: string;
    sortOrder?: number;
    isPinned?: boolean;
    isReadOnly?: boolean;
  }) {
    const channel = await this.communityService.createChannel(body);
    return { success: true, data: channel };
  }

  @Patch('channels/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async updateChannel(
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
    const channel = await this.communityService.updateChannel(id, body);
    return { success: true, data: channel };
  }

  @Delete('channels/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async archiveChannel(@Param('id') id: string) {
    await this.communityService.archiveChannel(id);
    return { success: true };
  }

  // ===== Messages =====

  @Get('channels/:channelId/messages')
  async getMessages(
    @Param('channelId') channelId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.communityService.getMessages(
      channelId,
      cursor,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data: result };
  }

  @Post('channels/:channelId/messages')
  async createMessage(
    @Param('channelId') channelId: string,
    @Request() req: any,
    @Body() body: { content: string; mediaUrls?: string[]; parentId?: string },
  ) {
    const message = await this.communityService.createMessage(channelId, req.user.id, body);
    return { success: true, data: message };
  }

  @Patch('messages/:id')
  async editMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const message = await this.communityService.editMessage(id, req.user.id, body.content);
    return { success: true, data: message };
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'coach';
    await this.communityService.deleteMessage(id, req.user.id, isAdmin);
    return { success: true };
  }

  @Get('messages/:id/replies')
  async getReplies(@Param('id') id: string) {
    const replies = await this.communityService.getReplies(id);
    return { success: true, data: replies };
  }

  // ===== Reactions =====

  @Post('messages/:id/reactions')
  async addReaction(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { emoji: string },
  ) {
    await this.communityService.addReaction(id, req.user.id, body.emoji);
    return { success: true };
  }

  @Delete('messages/:id/reactions/:emoji')
  async removeReaction(
    @Param('id') id: string,
    @Param('emoji') emoji: string,
    @Request() req: any,
  ) {
    await this.communityService.removeReaction(id, req.user.id, emoji);
    return { success: true };
  }

  // ===== Media Upload =====

  @Post('upload-url')
  async getUploadUrl(
    @Body() body: { fileName: string; contentType: string; channelId: string },
  ) {
    const result = await this.communityService.getUploadUrl(
      body.channelId,
      body.fileName,
      body.contentType,
    );
    return { success: true, data: result };
  }
}
