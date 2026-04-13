import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Discipline } from '@training-grounds/shared';
import { UserEntity } from './user.entity';
import { GymEntity } from './gym.entity';

@Entity('journal_entries')
@Index(['gymId', 'userId'])
export class JournalEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  attendanceId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  className!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  discipline!: Discipline | null;

  @Column({ type: 'text' })
  exploration!: string;

  @Column({ type: 'text' })
  challenge!: string;

  @Column({ type: 'text' })
  worked!: string;

  @Column({ type: 'text' })
  takeaways!: string;

  @Column({ type: 'text' })
  nextSession!: string;

  @Column({ type: 'boolean', default: false })
  isSharedWithCoach!: boolean;

  @Column({ type: 'text', nullable: true })
  coachFeedback!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
