import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AttendanceService } from './attendance.service';
import type { UserEntity } from '../../entities/user.entity';

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
}
