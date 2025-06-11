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
}
