import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
import { Service } from 'src/modules/services/entities/service.entity';
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
export class PackageService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    packageId: string;

    @Column()
    serviceId: string;

    @Column({ nullable: true })
    quantityLimit: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
    })
    discountPercentage: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(
        () => ServicePackage,
        (servicePackage) => servicePackage.packageServices,
    )
    @JoinColumn()
    package: ServicePackage;

    @ManyToOne(() => Service, (service) => service.packageServices)
    @JoinColumn()
    service: Service;
}
