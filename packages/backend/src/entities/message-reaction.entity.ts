import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ChannelMessageEntity } from './channel-message.entity';
import { GymEntity } from './gym.entity';

@Unique(['messageId', 'userId', 'emoji'])
@Entity('message_reactions')
export class MessageReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  gymId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  messageId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  emoji!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GymEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym!: GymEntity | null;

  @ManyToOne(() => ChannelMessageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message!: ChannelMessageEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
