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

@Entity('contraceptive_reminders')
export class ContraceptiveReminder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
}
