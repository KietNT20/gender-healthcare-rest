import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
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
export class TestResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    resultData: any;

    @Column({ type: 'text', nullable: true })
    resultSummary?: string;

    @Column({ default: false })
    isAbnormal: boolean;

    @Column({ type: 'text', nullable: true })
    recommendation?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    viewedAt?: Date;

    @Column({ default: false })
    notificationSent: boolean;

    @Column({ type: 'text', array: true, nullable: true })
    fileUploads?: string[];

    @Column({ default: false })
    followUpRequired: boolean;

    @Column({ type: 'text', nullable: true })
    followUpNotes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Appointment, (appointment) => appointment.testResults, {
        onDelete: 'CASCADE',
    })
    appointment: Appointment;

    @ManyToOne(() => User, (user) => user.testResults)
    staff: User;
}
