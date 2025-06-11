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

@Entity()
export class UserPackageSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  packageId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusType,
    default: SubscriptionStatusType.ACTIVE })
  status: SubscriptionStatusType;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  paymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.packageSubscriptions)
  @JoinColumn()
  user: User;

  @ManyToOne(
    () => ServicePackage,
    (servicePackage) => servicePackage.subscriptions,
  )
  @JoinColumn()
  package: ServicePackage;

  @ManyToOne(() => Payment, (payment) => payment.packageSubscriptions)
  @JoinColumn()
  payment: Payment;

  @OneToMany(() => PackageServiceUsage, (usage) => usage.subscription)
  serviceUsages: PackageServiceUsage[];
}




