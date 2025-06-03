import { SubscriptionStatusType } from '@enums/index';
import { Payment } from '@modules/payments/entities/payment.entity';
import { ServicePackage } from '@modules/service-packages/entities/service-package.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_package_subscriptions')
export class UserPackageSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'package_id' })
  packageId: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusType,
    default: SubscriptionStatusType.ACTIVE,
  })
  status: SubscriptionStatusType;

  @Column({ default: false, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ServicePackage)
  @JoinColumn({ name: 'package_id' })
  package: ServicePackage;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
