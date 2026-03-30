import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsEmail,
} from 'class-validator';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AttendanceService } from './attendance.service';
import type { UserEntity } from '../../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

const disciplines = [
  'bjj-gi',
  'bjj-nogi',
  'muay-thai',
  'wrestling',
  'mma',
  'boxing',
  'open-mat',
] as const;

const intensities = ['light', 'moderate', 'high', 'all-out'] as const;

class CheckinDto {
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsIn([...disciplines])
  discipline!: Discipline;

  @IsOptional()
  @IsIn([...intensities])
  intensityRating?: TrainingIntensity;
}

class CoachCheckinDto {
  @IsEmail()
  memberEmail!: string;

  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsIn([...disciplines])
  discipline!: Discipline;

  @IsOptional()
  @IsString()
  classScheduleId?: string;

  @IsOptional()
  @IsIn([...intensities])
  intensityRating?: TrainingIntensity;
}

class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q!: string;
}

interface AuthenticatedRequest {
  user: UserEntity;
}

@Controller('attendance')
@UseGuards(AuthGuard('jwt'))
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  async checkin(
    @Body() dto: CheckinDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const record = await this.attendanceService.checkin(req.user.id, {
      classId: dto.classId,
      className: dto.className,
      discipline: dto.discipline,
      intensityRating: dto.intensityRating,
    });

    return { success: true, data: record };
  }

  @Get('history')
  async getHistory(
    @Query() pagination: PaginationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const { records, total } = await this.attendanceService.getHistory(
      req.user.id,
      pagination.page,
      pagination.perPage,
    );

    return {
      success: true,
      data: records,
      meta: {
        page: pagination.page,
        perPage: pagination.perPage,
        total,
        totalPages: Math.ceil(total / pagination.perPage),
      },
    };
  }

  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    const stats = await this.attendanceService.getStats(req.user.id);
    return { success: true, data: stats };
  }

  // ---- Coach Check-in Endpoints ----

  @Post('coach-checkin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coach', 'admin')
  async coachCheckin(
    @Body() dto: CoachCheckinDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const record = await this.attendanceService.coachCheckin(req.user.id, dto.memberEmail, {
      classId: dto.classId,
      className: dto.className,
      discipline: dto.discipline,
      classScheduleId: dto.classScheduleId,
      intensityRating: dto.intensityRating,
    });
    return { success: true, data: record };
  }

  @Get('coach-checkin/search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coach', 'admin')
  async searchMembers(@Query() query: SearchQueryDto) {
    const members = await this.attendanceService.searchMembers(query.q);
    return { success: true, data: members };
  }

  @Get('roster/:classScheduleId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('coach', 'admin')
  async getClassRoster(
    @Param('classScheduleId') classScheduleId: string,
    @Query('date') date?: string,
  ) {
    const roster = await this.attendanceService.getClassRoster(classScheduleId, date);
    return { success: true, data: roster };
  }
}
