import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('gyms')
export class GymEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 7, default: '#C9A87C' })
  primaryColor!: string;

  @Column({ type: 'varchar', length: 7, default: '#1E1E1E' })
  secondaryColor!: string;

  @Column({ type: 'varchar', length: 7, default: '#2A2A2A' })
  surfaceColor!: string;

  @Column({ type: 'varchar', length: 7, default: '#FAFAF8' })
  textPrimary!: string;

  @Column({ type: 'varchar', length: 7, default: '#B0B5B8' })
  textMuted!: string;

  @Column({ type: 'varchar', length: 100, default: 'Bebas Neue' })
  headingFont!: string;

  @Column({ type: 'varchar', length: 100, default: 'Inter' })
  bodyFont!: string;

  @Column({ type: 'varchar', length: 50, default: 'America/New_York' })
  timezone!: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'boolean', default: true })
  streakFreezeEnabled!: boolean;

  @Column({ type: 'int', default: 2 })
  maxStreakFreezesPerMonth!: number;

  @Column({ type: 'boolean', default: false })
  referralProgramEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  communityEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  videoLibraryEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  journalEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  coachesCornerEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  leaderboardsEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  prTrackingEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  benchmarkWodEnabled!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'starter' })
  plan!: string;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ownerId' })
  owner!: UserEntity;

  @OneToMany(() => GymMembershipEntity, (m) => m.gym)
  memberships!: GymMembershipEntity[];
}

@Entity('gym_memberships')
@Unique(['gymId', 'userId'])
export class GymMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  gymId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @ManyToOne(() => GymEntity, (gym) => gym.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
