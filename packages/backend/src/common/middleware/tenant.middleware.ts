import { Injectable, NestMiddleware, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { GymEntity } from '../../entities/gym.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(GymEntity)
    private readonly gymRepo: Repository<GymEntity>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const gymId = req.headers['x-gym-id'] as string | undefined;

    if (!gymId) {
      throw new BadRequestException('X-Gym-Id header is required');
    }

    const gym = await this.gymRepo.findOne({ where: { id: gymId, isActive: true } });
    if (!gym) {
      throw new NotFoundException(`Gym not found: ${gymId}`);
    }

    (req as any).gymId = gym.id;
    (req as any).gym = gym;

    next();
  }
}
