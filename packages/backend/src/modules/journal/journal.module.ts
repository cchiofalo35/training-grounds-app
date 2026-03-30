import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JournalEntryEntity } from '../../entities/journal.entity';
import { JournalCommentEntity } from '../../entities/journal-comment.entity';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntryEntity, JournalCommentEntity]),
    PassportModule,
  ],
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
