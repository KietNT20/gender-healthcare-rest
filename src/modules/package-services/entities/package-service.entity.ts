import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ServicePackage } from '../../service-packages/entities/service-package.entity';
import { Service } from '../../services/entities/service.entity';

@Entity()
export class PackageService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'integer', default: 1 })
    quantityLimit?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Relations
    @ManyToOne(
        () => ServicePackage,
        (servicePackage) => servicePackage.packageServices,
    )
    servicePackage: ServicePackage;

    @ManyToOne(() => Service, (service) => service.packageServices)
    service: Service;
}
