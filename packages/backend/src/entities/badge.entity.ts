import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { BadgeCategory } from '@training-grounds/shared';
import { UserEntity } from './user.entity';

@Entity('badges')
export class BadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 512 })
  iconUrl!: string;

  @Column({ type: 'varchar', length: 30 })
  category!: BadgeCategory;

  @Column({ type: 'jsonb', default: '{}' })
  criteriaJson!: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('user_badges')
@Index(['userId', 'badgeId'], { unique: true })
export class UserBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  badgeId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  earnedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.userBadges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => BadgeEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge!: BadgeEntity;
}
