import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GamificationService } from './gamification.service';
import type { UserEntity } from '../../entities/user.entity';

interface AuthenticatedRequest {
  user: UserEntity;
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

  @Get('leaderboard')
  async getLeaderboard(@Query() pagination: PaginationDto) {
    const { entries, total } =
      await this.gamificationService.getLeaderboard(
        pagination.page,
        pagination.perPage,
      );

    return {
      success: true,
      data: entries,
      meta: {
        page: pagination.page,
        perPage: pagination.perPage,
        total,
        totalPages: Math.ceil(total / pagination.perPage),
      },
    };
  }
}
