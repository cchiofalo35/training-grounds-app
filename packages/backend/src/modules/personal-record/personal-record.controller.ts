import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsIn, IsString, MaxLength } from 'class-validator';
import { PersonalRecordService } from './personal-record.service';
import { CreatePrDto } from './dto/create-pr.dto';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import type { PrCategory } from '../../entities/personal-record.entity';

class ListPrsQueryDto {
  @IsOptional()
  @IsIn(['lift', 'benchmark_wod', 'gymnastics'])
  category?: PrCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  movement?: string;
}

@Controller('personal-records')
@UseGuards(AuthGuard('jwt'))
export class PersonalRecordController {
  constructor(private readonly prService: PersonalRecordService) {}

  @Post()
  async createPr(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePrDto,
  ) {
    const result = await this.prService.createPr(req.gymId, req.user.id, dto);
    return {
      success: true,
      data: {
        pr: result.pr,
        isNewPr: result.isNewPr,
        xpAwarded: result.xpAwarded,
      },
    };
  }

  @Get()
  async getMyPrs(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListPrsQueryDto,
  ) {
    const prs = await this.prService.getUserPrs(req.gymId, req.user.id, {
      category: query.category,
      movementName: query.movement,
    });
    return { success: true, data: prs };
  }

  @Get('history/:movement')
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Param('movement') movement: string,
  ) {
    const history = await this.prService.getPrHistory(
      req.gymId,
      req.user.id,
      movement,
    );
    return { success: true, data: history };
  }

  @Get('user/:userId')
  async getUserPrs(
    @Request() req: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListPrsQueryDto,
  ) {
    const prs = await this.prService.getUserPrs(req.gymId, userId, {
      category: query.category,
      movementName: query.movement,
    });
    return { success: true, data: prs };
  }

  @Get('leaderboard/:movement')
  async getLeaderboard(
    @Request() req: AuthenticatedRequest,
    @Param('movement') movement: string,
  ) {
    const entries = await this.prService.getLeaderboardForMovement(
      req.gymId,
      movement,
    );
    return { success: true, data: entries };
  }

  @Post(':id/verify')
  async verifyPr(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const pr = await this.prService.verifyPr(
      req.gymId,
      req.user.id,
      req.user.role,
      id,
    );
    return { success: true, data: pr };
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePr(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.prService.deletePr(req.gymId, req.user.id, id);
  }
}
