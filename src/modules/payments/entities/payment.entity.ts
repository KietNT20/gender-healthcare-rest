import { PaymentStatusType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  appointmentId: string;
=======
    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

<<<<<<< HEAD
  @Column({ length: 50 })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: PaymentStatusType,
    default: PaymentStatusType.PENDING })
  status: PaymentStatusType;

  @Column({ length: 255, nullable: true })
  transactionId: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true })
  paymentDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: any;
=======
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
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ default: false })
    refunded: boolean;

<<<<<<< HEAD
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0 })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Appointment, (appointment) => appointment.payments)
  @JoinColumn()
  appointment: Appointment;

  @OneToMany(
    () => UserPackageSubscription,
    (subscription) => subscription.payment,
  )
  packageSubscriptions: UserPackageSubscription[];
=======
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
    deletedAt: Date | null; // Relations
    @ManyToOne(() => User, (user) => user.payments)
    user: User;

    @ManyToOne(() => Appointment, (appointment) => appointment.payments)
    appointment: Appointment;

    @OneToMany(
        () => UserPackageSubscription,
        (subscription) => subscription.payment,
    )
    packageSubscriptions: UserPackageSubscription[];
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




