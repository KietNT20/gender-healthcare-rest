import { PriorityType } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
  @Column({ nullable: true })
  userId: string;
=======
    @Column({ name: 'user_id', nullable: true })
    userId: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 50 })
    type: string;

<<<<<<< HEAD
  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt: Date;

  @Column({ type: 'text', nullable: true })
  actionUrl: string;

  @Column({
    type: 'enum',
    enum: PriorityType,
    nullable: true })
  priority: PriorityType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn()
  user: User;
=======
    @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
    referenceId: string;

    @Column({ default: false, name: 'is_read' })
    isRead: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'read_at',
    })
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

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(() => User, (user) => user.notifications)
    user: User;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




