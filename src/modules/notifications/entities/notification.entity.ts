import { PriorityType } from '@enums/index';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
  referenceId: string;

  @Column({ default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'text', nullable: true, name: 'action_url' })
  actionUrl: string;

  @Column({
    type: 'enum',
    enum: PriorityType,
    nullable: true,
  })
  priority: PriorityType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
