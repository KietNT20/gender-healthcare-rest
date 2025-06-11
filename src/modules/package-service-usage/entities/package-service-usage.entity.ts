import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PackageServiceUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
}
