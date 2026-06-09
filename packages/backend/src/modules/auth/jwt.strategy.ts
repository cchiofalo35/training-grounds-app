import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import { GymMembershipEntity } from '../../entities/gym.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Authenticated user enriched with the gym-scoped role for the request's gym.
 *
 * `gymRole` is the role the user holds *in the gym named by the X-Gym-Id header*
 * — NOT their global `user.role`. Use gymRole for tenant-scoped authorization
 * so a coach in gym A can't act as a coach in gym B.
 */
export interface AuthenticatedUser extends UserEntity {
  gymRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GymMembershipEntity)
    private readonly membershipRepo: Repository<GymMembershipEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-in-production'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Enforce the tenant boundary: the authenticated user must be an active
    // member of the gym identified by the X-Gym-Id header. Without this check,
    // any logged-in user could pass an arbitrary gym id and operate inside it.
    const gymId =
      (req as unknown as { gymId?: string }).gymId ??
      (req.headers['x-gym-id'] as string | undefined);

    if (!gymId) {
      throw new ForbiddenException('Missing gym context');
    }

    const membership = await this.membershipRepo.findOne({
      where: { gymId, userId: user.id, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this gym');
    }

    return Object.assign(user, { gymRole: membership.role });
  }
}
