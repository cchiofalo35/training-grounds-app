import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { UserEntity } from '../../entities/user.entity';
import { AttendanceRecordEntity } from '../../entities/attendance.entity';
import { BadgeEntity, UserBadgeEntity } from '../../entities/badge.entity';
import { ClassScheduleEntity } from '../../entities/class-schedule.entity';
import { QuestEntity, UserQuestEntity } from '../../entities/quest.entity';
import { CourseEntity, CourseModuleEntity } from '../../entities/course.entity';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AttendanceRecordEntity,
      BadgeEntity,
      UserBadgeEntity,
      ClassScheduleEntity,
      QuestEntity,
      UserQuestEntity,
      CourseEntity,
      CourseModuleEntity,
      JournalEntryEntity,
    ]),
    PassportModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
