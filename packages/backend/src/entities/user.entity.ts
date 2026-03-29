import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { UserRole, BeltRank } from '@training-grounds/shared';
import { AttendanceRecordEntity } from './attendance.entity';
import { UserBadgeEntity } from './badge.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  firebaseUid!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'white' })
  beltRank!: BeltRank;

  @Column({ type: 'int', default: 0 })
  stripes!: number;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: UserRole;

  @Column({ type: 'int', default: 0 })
  totalXp!: number;

  @Column({ type: 'int', default: 0 })
  currentStreak!: number;

  @Column({ type: 'int', default: 0 })
  longestStreak!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  referralCode!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastActiveAt!: Date;

  @Column({ type: 'int', default: 0 })
  streakFreezes!: number;

  @Column({ type: 'int', default: 0 })
  streakFreezesUsed!: number;

  @Column({ type: 'date', nullable: true })
  lastCheckinDate!: string | null;

  @OneToMany(() => AttendanceRecordEntity, (record) => record.user)
  attendanceRecords!: AttendanceRecordEntity[];

  @OneToMany(() => UserBadgeEntity, (ub) => ub.user)
  userBadges!: UserBadgeEntity[];
}
