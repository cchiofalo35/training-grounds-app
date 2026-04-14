import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GamificationService, type LeaderboardPeriod } from './gamification.service';
import type { UserEntity } from '../../entities/user.entity';
import type { LeagueType } from '@training-grounds/shared';

interface AuthenticatedRequest {
  user: UserEntity;
}

class LeaderboardQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'all-time'])
  period?: LeaderboardPeriod;

  @IsOptional()
  @IsIn(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'black-belt-elite'])
  league?: LeagueType;
}

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('streak')
  async getStreak(@Request() req: AuthenticatedRequest) {
    const streak = await this.gamificationService.getStreak(req.user.id);
    return { success: true, data: streak };
  }

  @Post('streak/freeze')
  async freezeStreak(@Request() req: AuthenticatedRequest) {
    const streak = await this.gamificationService.freezeStreak(req.user.id);
    return { success: true, data: streak };
  }

  @Get('badges')
  async getBadges(@Request() req: AuthenticatedRequest) {
    const badges = await this.gamificationService.getUserBadges(req.user.id);
    return { success: true, data: badges };
  }

  @Get('badges/catalog')
  async getBadgeCatalog(@Request() req: AuthenticatedRequest) {
    const catalog = await this.gamificationService.getBadgeCatalog(req.user.id);
    return { success: true, data: catalog.badges };
  }

  @Get('leaderboard')
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    const { entries, total } = await this.gamificationService.getLeaderboard(
      query.page,
      query.perPage,
      query.period ?? 'all-time',
      query.league,
    );

    return {
      success: true,
      data: entries,
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  }

  @Get('quests')
  async getQuests(@Request() req: AuthenticatedRequest) {
    const quests = await this.gamificationService.getActiveQuestsWithProgress(
      req.user.id,
    );
    return { success: true, data: quests };
  }

  @Get('xp-guide')
  async getXpGuide() {
    return {
      success: true,
      data: {
        actions: [
          { action: 'Attend a class', xp: 50, description: 'Base XP per check-in' },
          { action: 'High intensity', xp: 75, description: '1.5x multiplier for high intensity' },
          { action: 'All-out intensity', xp: 100, description: '2x multiplier for max effort' },
          { action: '7-day streak bonus', xp: 100, description: 'Milestone XP + 1 freeze' },
          { action: '30-day streak bonus', xp: 500, description: 'Milestone XP + 2 freezes' },
          { action: 'Earn a badge', xp: 50, description: 'Bonus for each badge earned' },
        ],
        streakMultipliers: [
          { streak: 7, multiplier: 1.25 },
          { streak: 30, multiplier: 1.5 },
          { streak: 60, multiplier: 1.75 },
          { streak: 100, multiplier: 2.0 },
        ],
        streakMilestones: [
          { days: 7, xp: 100, freezes: 1 },
          { days: 14, xp: 250, freezes: 0 },
          { days: 30, xp: 500, freezes: 2 },
          { days: 60, xp: 1000, freezes: 2 },
          { days: 100, xp: 2500, freezes: 3 },
          { days: 365, xp: 10000, freezes: 5 },
        ],
      },
    };
  }
}
