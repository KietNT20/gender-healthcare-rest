import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PackageServiceUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
  @Column()
  subscriptionId: string;

  @Column()
  serviceId: string;

  @Column({ nullable: true })
  appointmentId: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  usageDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(
    () => UserPackageSubscription,
    (subscription) => subscription.serviceUsages,
  )
  @JoinColumn()
  subscription: UserPackageSubscription;

  @ManyToOne(() => Service, (service) => service.packageServiceUsages)
  @JoinColumn()
  service: Service;

  @ManyToOne(
    () => Appointment,
    (appointment) => appointment.packageServiceUsages,
  )
  @JoinColumn()
  appointment: Appointment;
=======
    @Column({ name: 'subscription_id' })
    subscriptionId: string;

    @Column({ name: 'service_id' })
    serviceId: string;

    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: string;

    @Column({ type: 'date', default: () => 'CURRENT_DATE', name: 'usage_date' })
    usageDate: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(
        () => UserPackageSubscription,
        (subscription) => subscription.serviceUsages,
    )
    subscription: UserPackageSubscription;

    @ManyToOne(() => Service, (service) => service.packageServiceUsages)
    service: Service;

    @ManyToOne(
        () => Appointment,
        (appointment) => appointment.packageServiceUsages,
    )
    appointment: Appointment;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




