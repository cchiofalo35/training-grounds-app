import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GymService } from './gym.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('gyms')
export class GymController {
  constructor(private readonly gymService: GymService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async onboardGym(@Body() dto: CreateGymDto) {
    const { gym, summary } = await this.gymService.onboardGym(dto);
    return { success: true, data: { gym, summary } };
  }

  @Get()
  async findAll(@Query() query: PaginationDto) {
    const { gyms, total } = await this.gymService.findAll(query.page, query.perPage);
    return {
      success: true,
      data: gyms,
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  }

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const gym = UUID_REGEX.test(idOrSlug)
      ? await this.gymService.findById(idOrSlug)
      : await this.gymService.findBySlug(idOrSlug);
    return { success: true, data: gym };
  }

  @Get(':slug/theme')
  async getTheme(@Param('slug') slug: string) {
    const gym = await this.gymService.findBySlug(slug);
    return {
      success: true,
      data: {
        primaryColor: gym.primaryColor,
        secondaryColor: gym.secondaryColor,
        headingFont: gym.headingFont,
        bodyFont: gym.bodyFont,
        logoUrl: gym.logoUrl,
      },
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateGymDto) {
    const gym = await this.gymService.update(id, dto);
    return { success: true, data: gym };
  }

  @Get(':id/members')
  @UseGuards(AuthGuard('jwt'))
  async getMembers(@Param('id') id: string, @Query() query: PaginationDto) {
    const { members, total } = await this.gymService.getMembers(id, query.page, query.perPage);
    return {
      success: true,
      data: members,
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  }

  @Post(':id/members')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'coach')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('id') gymId: string,
    @Body('userId') userId: string,
    @Body('role') role: string = 'member',
  ) {
    const membership = await this.gymService.addMember(gymId, userId, role);
    return { success: true, data: membership };
  }
}
