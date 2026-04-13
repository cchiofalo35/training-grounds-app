import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Discipline } from '@training-grounds/shared';
import { UserEntity } from './user.entity';
import { GymEntity } from './gym.entity';

@Entity('class_schedules')
export class ClassScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  discipline!: Discipline;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  instructorId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instructorName!: string | null;

  @Column({ type: 'int' }) // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayOfWeek!: number;

  @Column({ type: 'varchar', length: 5 }) // "09:00" HH:mm
  startTime!: string;

  @Column({ type: 'int', default: 60 })
  durationMinutes!: number;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ type: 'varchar', length: 30, default: 'all-levels' })
  level!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'instructorId' })
  instructor!: UserEntity | null;
}
