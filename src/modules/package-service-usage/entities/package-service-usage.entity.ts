import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import { Service } from 'src/modules/services/entities/service.entity';

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

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(
        () => UserPackageSubscription,
        (subscription) => subscription.serviceUsages,
    )
    subscription: UserPackageSubscription;

    @ManyToOne(() => Service, (service) => service.packageServiceUsages)
    service: Service;
}
