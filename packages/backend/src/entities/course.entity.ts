import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Discipline } from '@training-grounds/shared';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @OneToMany(() => CourseModuleEntity, (m) => m.course)
  modules!: CourseModuleEntity[];
}

import { ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('course_modules')
export class CourseModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @ManyToOne(() => CourseEntity, (c) => c.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;
}
