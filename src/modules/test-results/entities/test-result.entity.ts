import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('test_results')
export class TestResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: string;

    @Column({ name: 'staff_id', nullable: true })
    staffId: string;

    @Column({ type: 'jsonb', name: 'result_data' })
    resultData: any;

    @Column({ type: 'text', nullable: true, name: 'result_summary' })
    resultSummary: string;

    @Column({ default: false, name: 'is_abnormal' })
    isAbnormal: boolean;

    @Column({ type: 'text', nullable: true })
    recommendation: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'viewed_at',
    })
    viewedAt: Date;

    @Column({ default: false, name: 'notification_sent' })
    notificationSent: boolean;

    @Column({ type: 'text', array: true, nullable: true, name: 'file_uploads' })
    fileUploads: string[];

    @Column({ default: false, name: 'follow_up_required' })
    followUpRequired: boolean;

    @Column({ type: 'text', nullable: true, name: 'follow_up_notes' })
    followUpNotes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Appointment, (appointment) => appointment.testResults, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'appointment_id' })
    appointment: Appointment;

    @ManyToOne(() => User, (user) => user.testResults)
    @JoinColumn({ name: 'staff_id' })
    staff: User;
}
