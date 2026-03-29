import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { UserEntity } from '../../entities/user.entity';
import type { JwtPayload } from './jwt.strategy';

interface RegisterDto {
  firebaseToken: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(firebaseToken: string): Promise<{ accessToken: string; user: UserEntity }> {
    const decodedToken = await this.verifyFirebaseToken(firebaseToken);

    const user = await this.userRepo.findOne({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found. Please register first.',
      );
    }

    user.lastActiveAt = new Date();
    await this.userRepo.save(user);

    const accessToken = this.issueJwt(user);
    return { accessToken, user };
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: UserEntity }> {
    const decodedToken = await this.verifyFirebaseToken(dto.firebaseToken);

    const existing = await this.userRepo.findOne({
      where: { firebaseUid: decodedToken.uid },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const referralCode = this.generateReferralCode();

    const user = this.userRepo.create({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email ?? '',
      name: dto.name,
      beltRank: 'white',
      stripes: 0,
      role: 'member',
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      referralCode,
      streakFreezes: 2,
      streakFreezesUsed: 0,
    });

    const savedUser = await this.userRepo.save(user);
    const accessToken = this.issueJwt(savedUser);

    return { accessToken, user: savedUser };
  }

  async getMe(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async verifyFirebaseToken(
    token: string,
  ): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  private issueJwt(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TG-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
