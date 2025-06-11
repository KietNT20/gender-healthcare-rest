import { ReminderFrequencyType, ReminderStatusType } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContraceptiveReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ length: 100 })
  contraceptiveType: string;

  @Column({ type: 'time' })
  reminderTime: string;

  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ReminderFrequencyType,
    default: ReminderFrequencyType.DAILY })
  frequency: ReminderFrequencyType;

  @Column({
    type: 'enum',
    enum: ReminderStatusType,
    default: ReminderStatusType.ACTIVE })
  @Index()
  status: ReminderStatusType;

  @Column({ type: 'int', array: true, nullable: true })
  daysOfWeek: number[];

  @Column({ type: 'text', nullable: true })
  reminderMessage: string;

  @Column({ default: 0 })
  snoozeCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @Index()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.contraceptiveReminders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}




