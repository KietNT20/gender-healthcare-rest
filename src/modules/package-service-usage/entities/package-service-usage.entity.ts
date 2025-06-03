import { Appointment } from '@modules/appointments/entities/appointment.entity';
import { Service } from '@modules/services/entities/service.entity';
import { UserPackageSubscription } from '@modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('package_service_usage')
export class PackageServiceUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // Relations
  @ManyToOne(() => UserPackageSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserPackageSubscription;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
