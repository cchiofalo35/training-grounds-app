import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { GymEntity } from './gym.entity';

export type SkillCategory = 'gymnastics' | 'weightlifting' | 'monostructural' | 'other';
export type SkillProgressLevel =
  | 'not_started'
  | 'learning'
  | 'scaling'
  | 'rx'
  | 'competition';

/**
 * SkillEntity — catalog of CrossFit movements and skills tracked per gym.
 *
 * Examples: Kipping Pull-Up, Ring Muscle-Up, Handstand Walk, Clean & Jerk, Snatch.
 * Tenant-scoped: each gym maintains its own skill catalog.
 */
@Entity('skills')
@Unique(['gymId', 'name'])
@Index(['gymId', 'category'])
export class SkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  gymId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  category!: SkillCategory;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  difficultyLevel!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  videoUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => GymEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity;
}

/**
 * UserSkillProgressEntity — per-user progression on a skill.
 *
 * Tracks where each athlete is on the CrossFit skill ladder:
 *   not_started → learning → scaling → rx → competition
 */
@Entity('user_skill_progress')
@Unique(['gymId', 'userId', 'skillId'])
@Index(['gymId', 'userId'])
@Index(['gymId', 'skillId'])
export class UserSkillProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  gymId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'uuid' })
  skillId!: string;

  @Column({ type: 'varchar', length: 30, default: 'not_started' })
  progressLevel!: SkillProgressLevel;

  @Column({ type: 'timestamptz', nullable: true })
  firstLearnedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastPracticedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  practiceCount!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => GymEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => SkillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill!: SkillEntity;
}
