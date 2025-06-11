import { AppointmentStatusType, LocationTypeEnum } from 'src/enums';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { ConsultantProfile } from 'src/modules/consultant-profiles/entities/consultant-profile.entity';
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
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('appointments')
@Index('idx_appointments_not_deleted', ['id'], { where: 'deleted_at IS NULL' })
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'timestamp with time zone', name: 'appointment_date' })
    @Index('idx_appointments_date')
    appointmentDate: Date;

    @Column({
        type: 'enum',
        enum: AppointmentStatusType,
        default: AppointmentStatusType.PENDING,
    })
    @Index('idx_appointments_status')
    status: AppointmentStatusType;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ length: 255, nullable: true, name: 'meeting_link' })
    meetingLink: string;

    @Column({ default: false, name: 'reminder_sent' })
    reminderSent: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'reminder_sent_at',
    })
    reminderSentAt: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'check_in_time',
    })
    checkInTime: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'check_out_time',
    })
    checkOutTime: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'fixed_price' })
    fixedPrice: number;

    @Column({
        length: 20,
        default: 'system',
        name: 'consultant_selection_type',
    })
    consultantSelectionType: string;

    @Column({
        type: 'enum',
        enum: LocationTypeEnum,
        default: LocationTypeEnum.OFFICE,
        name: 'appointment_location',
    })
    @Index('idx_appointments_location')
    appointmentLocation: LocationTypeEnum;

    @Column({ name: 'availability_id', nullable: true })
    availabilityId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_appointments_deleted_at')
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.appointments)
    user: User;

    @ManyToOne(
        () => ConsultantProfile,
        (consultantProfile) => consultantProfile.consultantAppointments,
    )
    consultant: ConsultantProfile;

    @ManyToOne(
        () => ConsultantAvailability,
        (availability) => availability.appointments,
    )
    availability: ConsultantAvailability;

    @OneToMany(() => Payment, (payment) => payment.appointment)
    payments: Payment[];

    @OneToMany(() => Feedback, (feedback) => feedback.appointment)
    feedbacks: Feedback[];

    @OneToMany(() => TestResult, (testResult) => testResult.appointment)
    testResults: TestResult[];

    @OneToMany(() => PackageServiceUsage, (usage) => usage.appointment)
    packageServiceUsages: PackageServiceUsage[];

    @ManyToMany(() => Service, (service) => service.id)
    @JoinTable()
    services: Service[];
}
