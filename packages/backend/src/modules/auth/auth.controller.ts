import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import type { UserEntity } from '../../entities/user.entity';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  firebaseToken!: string;
}

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firebaseToken!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

interface AuthenticatedRequest {
  user: UserEntity;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('x-gym-id') gymId?: string,
  ) {
    // Pass the gym the app is scoped to so login can self-heal a missing
    // membership (e.g. existing accounts created before memberships were
    // enforced, or a user opening a second tenant app for the first time).
    const result = await this.authService.login(dto.firebaseToken, gymId);
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Headers('x-gym-id') gymId?: string,
  ) {
    const result = await this.authService.register({
      firebaseToken: dto.firebaseToken,
      name: dto.name,
      gymId,
    });
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req: AuthenticatedRequest) {
    const user = await this.authService.getMe(req.user.id);
    return {
      success: true,
      data: user,
    };
  }
}
