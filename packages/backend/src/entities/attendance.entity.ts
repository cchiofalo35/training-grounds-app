import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Discipline, TrainingIntensity } from '@training-grounds/shared';
import { UserEntity } from './user.entity';

@Entity('attendance_records')
export class AttendanceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  classId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  checkedInAt!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  intensityRating!: TrainingIntensity | null;

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  @Column({ type: 'varchar', length: 255 })
  className!: string;

  @Column({ type: 'varchar', length: 30 })
  discipline!: Discipline;

  @ManyToOne(() => UserEntity, (user) => user.attendanceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
