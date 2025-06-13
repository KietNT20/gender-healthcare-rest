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
    subscription: UserPackageSubscription;

    @ManyToOne(() => Service, (service) => service.packageServiceUsages)
    service: Service;

    @ManyToOne(
        () => Appointment,
        (appointment) => appointment.packageServiceUsages,
    )
    appointment: Appointment;
}
