import {
    AppointmentStatusType,
    ConsultantSelectionType,
    LocationTypeEnum,
} from 'src/enums';
import { Question } from 'src/modules/chat/entities/question.entity';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { StiTestProcess } from 'src/modules/sti-test-processes/entities/sti-test-process.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['user', 'consultant', 'appointmentDate'])
@Index(['consultant', 'status', 'appointmentDate'])
@Index(['user', 'status'])
@Index(['appointmentDate', 'status'])
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

    @Column({ length: 1024, nullable: true })
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

    @Column({ type: 'numeric', precision: 15, scale: 0 })
    fixedPrice: number;

    @Column({
        type: 'enum',
        enum: ConsultantSelectionType,
        default: ConsultantSelectionType.MANUAL,
    })
    consultantSelectionType: ConsultantSelectionType;

    @Column({
        type: 'enum',
        enum: LocationTypeEnum,
        default: LocationTypeEnum.OFFICE,
    })
    @Index()
    appointmentLocation: LocationTypeEnum;

    @Column({ type: 'text', nullable: true })
    cancellationReason?: string;

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

    @ManyToOne(() => User, { nullable: true })
    cancelledBy?: User;

    @ManyToOne(() => User, (user) => user.consultantAppointments, {
        nullable: true,
    })
    consultant?: User;

    @ManyToOne(
        () => ConsultantAvailability,
        (consultantAvailability) => consultantAvailability.appointments,
        { nullable: true, onDelete: 'SET NULL' },
    )
    consultantAvailability?: ConsultantAvailability;

    @OneToMany(() => Payment, (payment) => payment.appointment)
    payments: Payment[];

    @OneToMany(() => Feedback, (feedback) => feedback.appointment)
    feedbacks: Feedback[];

    @OneToOne(() => TestResult, (testResult) => testResult.appointment)
    @JoinColumn()
    testResult: TestResult;

    @OneToOne(
        () => StiTestProcess,
        (stiTestProcess) => stiTestProcess.appointment,
    )
    stiTestProcess: StiTestProcess;

    @ManyToMany(() => Service, (service) => service.appointments)
    @JoinTable()
    services: Service[];

    @OneToOne(() => Question, (question) => question.appointment, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn()
    question?: Question;
}
