import { PaymentStatusType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import { User } from 'src/modules/users/entities/user.entity';
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

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50, name: 'payment_method' })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: PaymentStatusType,
    default: PaymentStatusType.PENDING,
  })
  status: PaymentStatusType;

  @Column({ length: 255, nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'payment_date',
  })
  paymentDate: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'gateway_response' })
  gatewayResponse: any;

  @Column({ default: false })
  refunded: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'refund_amount',
  })
  refundAmount: number;

  @Column({ type: 'text', nullable: true, name: 'refund_reason' })
  refundReason: string;

  @Column({ length: 50, nullable: true, name: 'invoice_number' })
  invoiceNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Appointment, (appointment) => appointment.payments)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @OneToMany(
    () => UserPackageSubscription,
    (subscription) => subscription.payment,
  )
  packageSubscriptions: UserPackageSubscription[];
}
