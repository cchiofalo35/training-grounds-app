import {
  Controller,
  Post,
  Get,
  Body,
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
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.firebaseToken);
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register({
      firebaseToken: dto.firebaseToken,
      name: dto.name,
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
