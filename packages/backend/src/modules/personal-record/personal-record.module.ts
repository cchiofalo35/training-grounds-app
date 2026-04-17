import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PersonalRecordEntity } from '../../entities/personal-record.entity';
import { ChannelEntity } from '../../entities/channel.entity';
import { ChannelMessageEntity } from '../../entities/channel-message.entity';
import { UserEntity } from '../../entities/user.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { PersonalRecordController } from './personal-record.controller';
import { PersonalRecordService } from './personal-record.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PersonalRecordEntity,
      ChannelEntity,
      ChannelMessageEntity,
      UserEntity,
    ]),
    PassportModule,
    GamificationModule,
  ],
  controllers: [PersonalRecordController],
  providers: [PersonalRecordService],
  exports: [PersonalRecordService],
})
export class PersonalRecordModule {}
