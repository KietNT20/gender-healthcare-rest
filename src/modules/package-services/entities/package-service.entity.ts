import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('package_services')
export class PackageService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'package_id' })
    packageId: string;

    @Column({ name: 'service_id' })
    serviceId: string;

    @Column({ nullable: true, name: 'quantity_limit' })
    quantityLimit: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
        name: 'discount_percentage',
    })
    discountPercentage: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(
        () => ServicePackage,
        (servicePackage) => servicePackage.packageServices,
    )
    package: ServicePackage;

    @ManyToOne(() => Service, (service) => service.packageServices)
    service: Service;
}
