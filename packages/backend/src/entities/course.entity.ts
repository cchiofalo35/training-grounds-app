import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Discipline } from '@training-grounds/shared';
import { GymEntity } from './gym.entity';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 30 })
  discipline!: Discipline;

  @Column({ type: 'varchar', length: 20, nullable: true })
  beltLevel!: string | null;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @OneToMany(() => CourseModuleEntity, (m) => m.course)
  modules!: CourseModuleEntity[];
}

@Entity('course_modules')
export class CourseModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'jsonb', default: '[]' })
  techniques!: Array<{ name: string; description?: string }>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => CourseEntity, (c) => c.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;
}
