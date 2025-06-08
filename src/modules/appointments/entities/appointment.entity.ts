import { AppointmentStatusType, LocationTypeEnum } from '@enums/index';
import { AppointmentService } from '@modules/appointment-services/entities/appointment-service.entity';
import { ConsultantAvailability } from '@modules/consultant-availability/entities/consultant-availability.entity';
import { Feedback } from '@modules/feedbacks/entities/feedback.entity';
import { PackageServiceUsage } from '@modules/package-service-usage/entities/package-service-usage.entity';
import { Payment } from '@modules/payments/entities/payment.entity';
import { TestResult } from '@modules/test-results/entities/test-result.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'consultant_id', nullable: true })
  consultantId: string;

  @Column({ type: 'timestamp with time zone', name: 'appointment_date' })
  appointmentDate: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatusType,
    default: AppointmentStatusType.PENDING,
  })
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
  appointmentLocation: LocationTypeEnum;

  @Column({ name: 'availability_id', nullable: true })
  availabilityId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.appointments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.consultantAppointments)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @ManyToOne(
    () => ConsultantAvailability,
    (availability) => availability.appointments,
  )
  @JoinColumn({ name: 'availability_id' })
  availability: ConsultantAvailability;

  @OneToMany(
    () => AppointmentService,
    (appointmentService) => appointmentService.appointment,
  )
  appointmentServices: AppointmentService[];

  @OneToMany(() => Payment, (payment) => payment.appointment)
  payments: Payment[];

  @OneToMany(() => Feedback, (feedback) => feedback.appointment)
  feedbacks: Feedback[];

  @OneToMany(() => TestResult, (testResult) => testResult.appointment)
  testResults: TestResult[];

  @OneToMany(() => PackageServiceUsage, (usage) => usage.appointment)
  packageServiceUsages: PackageServiceUsage[];
}
