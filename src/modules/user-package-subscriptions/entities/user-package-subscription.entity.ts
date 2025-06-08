import { SubscriptionStatusType } from 'src/enums';
import { PackageServiceUsage } from 'src/modules/package-service-usage/entities/package-service-usage.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
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

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.packageSubscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    () => ServicePackage,
    (servicePackage) => servicePackage.subscriptions,
  )
  @JoinColumn({ name: 'package_id' })
  package: ServicePackage;

  @ManyToOne(() => Payment, (payment) => payment.packageSubscriptions)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @OneToMany(() => PackageServiceUsage, (usage) => usage.subscription)
  serviceUsages: PackageServiceUsage[];
}
