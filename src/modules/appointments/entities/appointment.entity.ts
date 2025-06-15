import { AppointmentStatusType, LocationTypeEnum } from 'src/enums';
import { Question } from 'src/modules/chat/entities/question.entity';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { PackageServiceUsage } from 'src/modules/package-service-usage/entities/package-service-usage.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'timestamp with time zone' })
    @Index()
    appointmentDate: Date;

    @Column({
        type: 'enum',
        enum: AppointmentStatusType,
        default: AppointmentStatusType.PENDING,
    })
    @Index()
    status: AppointmentStatusType;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ length: 255, nullable: true })
    meetingLink?: string;

    @Column({ default: false })
    reminderSent: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    reminderSentAt?: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    checkInTime?: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    checkOutTime?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    fixedPrice: number;

    @Column({
        length: 20,
        default: 'system',
    })
    consultantSelectionType: string;

    @Column({
        type: 'enum',
        enum: LocationTypeEnum,
        default: LocationTypeEnum.OFFICE,
    })
    @Index()
    appointmentLocation: LocationTypeEnum;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    @Index()
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.appointments)
    user: User;

    @ManyToOne(() => User, (user) => user.consultantAppointments)
    consultant: User;

    @ManyToOne(
        () => ConsultantAvailability,
        (consultantAvailability) => consultantAvailability.appointments,
    )
    consultantAvailability: ConsultantAvailability;

    @OneToMany(() => Payment, (payment) => payment.appointment)
    payments: Payment[];

    @OneToMany(() => Feedback, (feedback) => feedback.appointment)
    feedbacks: Feedback[];

    @OneToOne(() => TestResult, (testResult) => testResult.appointment)
    testResult: TestResult;

    @OneToMany(() => PackageServiceUsage, (usage) => usage.appointment)
    packageServiceUsages: PackageServiceUsage[];

    @ManyToMany(() => Service)
    services: Service[];

    @OneToOne(() => Question, (question) => question.appointment, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    question?: Question;
}
