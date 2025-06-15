import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
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

    @Column({ default: false })
    notificationSent: boolean;

    @Column({ default: false })
    followUpRequired: boolean;

    @Column({ type: 'text', nullable: true })
    followUpNotes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @OneToOne(() => Appointment, (appointment) => appointment.testResult, {
        onDelete: 'CASCADE',
    })
    appointment: Appointment;

    @OneToOne(() => Service)
    @JoinColumn()
    service: Service;

    @ManyToOne(() => User, (user) => user.testResults)
    user: User;
}
