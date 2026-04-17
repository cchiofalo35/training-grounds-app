import type { UserEntity } from '../../entities/user.entity';
import type { GymEntity } from '../../entities/gym.entity';

export interface AuthenticatedRequest {
  user: UserEntity;
  gymId: string;
  gym: GymEntity;
}
