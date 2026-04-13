import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { JournalEntryEntity } from './journal.entity';
import { GymEntity } from './gym.entity';

@Entity('journal_comments')
export class JournalCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  journalEntryId!: string;

  @Index()
  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry!: JournalEntryEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: UserEntity;
}
