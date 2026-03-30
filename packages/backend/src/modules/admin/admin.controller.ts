import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { Discipline, BadgeCategory } from '@training-grounds/shared';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

// ==================== DTOs ====================

const disciplines = [
  'bjj-gi', 'bjj-nogi', 'muay-thai', 'wrestling', 'mma', 'boxing', 'open-mat',
] as const;

// --- Members ---

class MembersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['member', 'coach', 'admin'])
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @IsOptional()
  @IsIn(['joinedAt', 'name', 'totalXp', 'lastActiveAt'])
  sortBy?: string;
}

class UpdateMemberDto {
  @IsOptional()
  @IsIn(['member', 'coach', 'admin'])
  role?: string;

  @IsOptional()
  @IsIn(['white', 'blue', 'purple', 'brown', 'black'])
  beltRank?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  stripes?: number;
}

// --- Classes ---

class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn([...disciplines])
  discipline!: Discipline;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(['all-levels', 'beginner', 'intermediate', 'advanced'])
  level?: string;
}

class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn([...disciplines])
  discipline?: Discipline;

  @IsOptional()
  @IsString()
  instructorId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @IsIn(['all-levels', 'beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Badges ---

const badgeCategories = [
  'attendance', 'discipline', 'competition', 'social', 'secret',
] as const;

class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  iconUrl!: string;

  @IsIn([...badgeCategories])
  category!: BadgeCategory;

  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

class UpdateBadgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsIn([...badgeCategories])
  category?: BadgeCategory;

  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

// --- Quests ---

class CreateQuestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(['weekly', 'monthly', 'special'])
  type!: string;

  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @IsOptional()
  @IsString()
  badgeRewardId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

class UpdateQuestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'special'])
  type?: string;

  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @IsOptional()
  @IsString()
  badgeRewardId?: string | null;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Courses ---

class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn([...disciplines])
  discipline!: Discipline;

  @IsOptional()
  @IsString()
  beltLevel?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([...disciplines])
  discipline?: Discipline;

  @IsOptional()
  @IsString()
  beltLevel?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  techniques?: Array<{ name: string; description?: string }>;
}

class UpdateModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  techniques?: Array<{ name: string; description?: string }>;
}

// --- Analytics ---

class AttendanceTrendsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

// ==================== Controller ====================

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'coach')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---- Members ----

  @Get('members')
  async getMembers(@Query() query: MembersQueryDto) {
    const { members, total } = await this.adminService.getMembers(
      query.search,
      query.role,
      query.page || 1,
      query.perPage || 20,
      query.sortBy || 'joinedAt',
    );
    return {
      success: true,
      data: members,
      meta: {
        page: query.page || 1,
        perPage: query.perPage || 20,
        total,
        totalPages: Math.ceil(total / (query.perPage || 20)),
      },
    };
  }

  @Get('members/:id')
  async getMember(@Param('id') id: string) {
    const member = await this.adminService.getMember(id);
    return { success: true, data: member };
  }

  @Patch('members/:id')
  async updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    const member = await this.adminService.updateMember(id, dto);
    return { success: true, data: member };
  }

  // ---- Classes ----

  @Get('classes')
  async getClasses() {
    const classes = await this.adminService.getClasses();
    return { success: true, data: classes };
  }

  @Post('classes')
  async createClass(@Body() dto: CreateClassDto) {
    const cls = await this.adminService.createClass(dto);
    return { success: true, data: cls };
  }

  @Patch('classes/:id')
  async updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    const cls = await this.adminService.updateClass(id, dto);
    return { success: true, data: cls };
  }

  @Delete('classes/:id')
  async deleteClass(@Param('id') id: string) {
    await this.adminService.deleteClass(id);
    return { success: true };
  }

  // ---- Badges ----

  @Get('badges')
  async getBadges() {
    const badges = await this.adminService.getBadges();
    return { success: true, data: badges };
  }

  @Post('badges')
  async createBadge(@Body() dto: CreateBadgeDto) {
    const badge = await this.adminService.createBadge(dto);
    return { success: true, data: badge };
  }

  @Patch('badges/:id')
  async updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    const badge = await this.adminService.updateBadge(id, dto);
    return { success: true, data: badge };
  }

  @Delete('badges/:id')
  async deleteBadge(@Param('id') id: string) {
    await this.adminService.deleteBadge(id);
    return { success: true };
  }

  // ---- Quests ----

  @Get('quests')
  async getQuests() {
    const quests = await this.adminService.getQuests();
    return { success: true, data: quests };
  }

  @Post('quests')
  async createQuest(@Body() dto: CreateQuestDto) {
    const quest = await this.adminService.createQuest(dto);
    return { success: true, data: quest };
  }

  @Patch('quests/:id')
  async updateQuest(@Param('id') id: string, @Body() dto: UpdateQuestDto) {
    const quest = await this.adminService.updateQuest(id, dto);
    return { success: true, data: quest };
  }

  @Delete('quests/:id')
  async deleteQuest(@Param('id') id: string) {
    await this.adminService.deleteQuest(id);
    return { success: true };
  }

  // ---- Courses ----

  @Get('courses')
  async getCourses() {
    const courses = await this.adminService.getCourses();
    return { success: true, data: courses };
  }

  @Post('courses')
  async createCourse(@Body() dto: CreateCourseDto) {
    const course = await this.adminService.createCourse(dto);
    return { success: true, data: course };
  }

  @Patch('courses/:id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const course = await this.adminService.updateCourse(id, dto);
    return { success: true, data: course };
  }

  @Delete('courses/:id')
  async deleteCourse(@Param('id') id: string) {
    await this.adminService.deleteCourse(id);
    return { success: true };
  }

  @Post('courses/:id/modules')
  async addModule(@Param('id') courseId: string, @Body() dto: CreateModuleDto) {
    const mod = await this.adminService.addModule(courseId, dto);
    return { success: true, data: mod };
  }

  @Patch('courses/:courseId/modules/:moduleId')
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    const mod = await this.adminService.updateModule(moduleId, dto);
    return { success: true, data: mod };
  }

  @Delete('courses/:courseId/modules/:moduleId')
  async deleteModule(@Param('moduleId') moduleId: string) {
    await this.adminService.deleteModule(moduleId);
    return { success: true };
  }

  // ---- Analytics ----

  @Get('analytics/overview')
  async getOverview() {
    const overview = await this.adminService.getOverview();
    return { success: true, data: overview };
  }

  @Get('analytics/attendance')
  async getAttendanceTrends(@Query() query: AttendanceTrendsQueryDto) {
    const trends = await this.adminService.getAttendanceTrends(query.days || 30);
    return { success: true, data: trends };
  }

  @Get('analytics/disciplines')
  async getDisciplineBreakdown() {
    const breakdown = await this.adminService.getDisciplineBreakdown();
    return { success: true, data: breakdown };
  }
}
