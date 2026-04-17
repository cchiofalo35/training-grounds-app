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
import { GymEntity } from './gym.entity';

export type PrCategory = 'lift' | 'benchmark_wod' | 'gymnastics';
export type PrValueUnit = 'kg' | 'lbs' | 'seconds' | 'reps';

/**
 * PersonalRecordEntity — tracks CrossFit-specific personal records.
 *
 * Categories:
 *  - lift: strength PRs (Back Squat, Clean & Jerk, etc.) — value is weight
 *  - benchmark_wod: timed/scored WODs (Fran, Murph, etc.) — value is seconds (lower is better)
 *  - gymnastics: rep-based PRs (Double-Unders x50, Toes-to-Bar x20) — value is reps
 *
 * Tenant-scoped via gymId. Every query must filter by gymId.
 */
@Entity('personal_records')
@Index(['gymId', 'userId', 'movementName'])
@Index(['gymId', 'movementName', 'valueNumeric'])
@Index(['gymId', 'loggedAt'])
export class PersonalRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  gymId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  category!: PrCategory;

  @Column({ type: 'varchar', length: 100 })
  movementName!: string;

  /**
   * Numeric value of the PR:
   *  - lift: weight in kg or lbs
   *  - benchmark_wod: time in seconds (lower = better)
   *  - gymnastics: rep count
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valueNumeric!: string;

  @Column({ type: 'varchar', length: 10 })
  valueUnit!: PrValueUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousBest!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  improvementAmount!: string | null;

  @Column({ type: 'boolean', default: false })
  isAllTimePr!: boolean;

  @Column({ type: 'boolean', default: false })
  isBodyweight!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bodyweightAtLog!: string | null;

  @Column({ type: 'timestamptz' })
  loggedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  videoUrl!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  verifiedByCoachId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GymEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verifiedByCoachId' })
  verifiedByCoach!: UserEntity | null;
}
