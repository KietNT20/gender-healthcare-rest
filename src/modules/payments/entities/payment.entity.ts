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

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  appointmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

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

  @Column({ default: false })
  refunded: boolean;

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
}




