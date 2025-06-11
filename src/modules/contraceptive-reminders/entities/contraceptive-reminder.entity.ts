import { ReminderFrequencyType, ReminderStatusType } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContraceptiveReminder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
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
=======
    @Column({ name: 'user_id', nullable: true })
    @Index('idx_contraceptive_reminders_user_id')
    userId: string;

    @Column({ length: 100, name: 'contraceptive_type' })
    contraceptiveType: string;

    @Column({ type: 'time', name: 'reminder_time' })
    reminderTime: string;

    @Column({ type: 'date', name: 'start_date' })
    @Index('idx_contraceptive_reminders_start_date')
    startDate: Date;

    @Column({ type: 'date', nullable: true, name: 'end_date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: ReminderFrequencyType,
        default: ReminderFrequencyType.DAILY,
    })
    frequency: ReminderFrequencyType;

    @Column({
        type: 'enum',
        enum: ReminderStatusType,
        default: ReminderStatusType.ACTIVE,
    })
    @Index('idx_contraceptive_reminders_status')
    status: ReminderStatusType;

    @Column({ type: 'int', array: true, nullable: true, name: 'days_of_week' })
    daysOfWeek: number[];

    @Column({ type: 'text', nullable: true, name: 'reminder_message' })
    reminderMessage: string;

    @Column({ default: 0, name: 'snooze_count' })
    snoozeCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_contraceptive_reminders_deleted_at')
    deletedAt: Date | null; // Relations
    @ManyToOne(() => User, (user) => user.contraceptiveReminders, {
        onDelete: 'CASCADE',
    })
    user: User;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




