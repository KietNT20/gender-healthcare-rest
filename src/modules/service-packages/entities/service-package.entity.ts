import { PackageService } from 'src/modules/package-services/entities/package-service.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ServicePackage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'numeric', precision: 15, scale: 0 })
    price: number;

    @Column()
    durationMonths: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    maxServicesPerMonth?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Relations
    @OneToMany(
        () => PackageService,
        (packageService) => packageService.servicePackage,
    )
    packageServices: PackageService[];

    @OneToMany(
        () => UserPackageSubscription,
        (subscription) => subscription.package,
    )
    subscriptions: UserPackageSubscription[];

    @OneToMany(() => Payment, (payment) => payment.servicePackage)
    payments: Payment[];
}
