import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { UserService } from './user.service';
import type { UserEntity } from '../../entities/user.entity';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

interface AuthenticatedRequest {
  user: UserEntity;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return { success: true, data: user };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.userService.update(id, dto);
    return { success: true, data: user };
  }

  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const stats = await this.userService.getStats(id);
    return { success: true, data: stats };
  }
}
