import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { UserEntity } from '../../entities/user.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceRecordEntity, UserEntity]),
    PassportModule,
    GamificationModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
