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
import { BadgeEntity } from './badge.entity';

@Entity('quests')
export class QuestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 20 }) // weekly | monthly | special
  type!: string;

  @Column({ type: 'jsonb', default: '{}' })
  criteriaJson!: Record<string, unknown>;

  @Column({ type: 'int', default: 100 })
  xpReward!: number;

  @Column({ type: 'uuid', nullable: true })
  badgeRewardId!: string | null;

  @Column({ type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => BadgeEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'badgeRewardId' })
  badgeReward!: BadgeEntity | null;
}

@Entity('user_quests')
@Index(['userId', 'questId'], { unique: true })
export class UserQuestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  questId!: string;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => QuestEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questId' })
  quest!: QuestEntity;
}
