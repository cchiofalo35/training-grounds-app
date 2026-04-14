import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { GymEntity, GymMembershipEntity } from '../../entities/gym.entity';
import { UserEntity } from '../../entities/user.entity';
import { ChannelEntity } from '../../entities/channel.entity';
import { BadgeEntity } from '../../entities/badge.entity';
import { QuestEntity } from '../../entities/quest.entity';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymEntity,
      GymMembershipEntity,
      UserEntity,
      ChannelEntity,
      BadgeEntity,
      QuestEntity,
    ]),
    PassportModule,
  ],
  controllers: [GymController],
  providers: [GymService],
  exports: [GymService],
})
export class GymModule {}
