import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { UserEntity } from '../../entities/user.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { NotificationModule } from '../notification/notification.module';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BadgeEntity,
      UserBadgeEntity,
      AttendanceRecordEntity,
    ]),
    PassportModule,
    NotificationModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
