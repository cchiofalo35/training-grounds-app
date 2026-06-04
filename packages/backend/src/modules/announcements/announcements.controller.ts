import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnnouncementsService } from './announcements.service';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

@Controller('announcements')
@UseGuards(AuthGuard('jwt'))
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  /** Members: active announcements for their gym (home banner). */
  @Get('active')
  async active(@Request() req: AuthenticatedRequest) {
    return { success: true, data: await this.service.getActive(req.gymId) };
  }

  /** Coaches/admins: list all announcements for managing. */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async list(@Request() req: AuthenticatedRequest) {
    return { success: true, data: await this.service.findAll(req.gymId) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async create(@Body() dto: CreateAnnouncementDto, @Request() req: AuthenticatedRequest) {
    const data = await this.service.create(req.gymId, {
      ...dto,
      createdBy: req.user.id,
      createdByName: req.user.name,
    });
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return { success: true, data: await this.service.update(req.gymId, id, dto) };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.service.remove(req.gymId, id);
    return { success: true };
  }
}
