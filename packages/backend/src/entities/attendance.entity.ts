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
import { ClassScheduleEntity } from './class-schedule.entity';
import { GymEntity } from './gym.entity';

@Entity('attendance_records')
@Index(['gymId', 'userId'])
export class AttendanceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

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

  @Column({ type: 'uuid', nullable: true })
  checkedInByUserId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  classScheduleId!: string | null;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.attendanceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'checkedInByUserId' })
  checkedInBy!: UserEntity | null;

  @ManyToOne(() => ClassScheduleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classScheduleId' })
  classSchedule!: ClassScheduleEntity | null;
}
