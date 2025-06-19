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

/*
Là bảng trung gian xác định dịch vụ nào nằm trong gói nào, và kèm theo các cấu hình riêng như giới hạn lượt dùng hoặc giảm giá cho dịch vụ đó trong gói.
*/
@Entity()
export class PackageService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
    package: ServicePackage;

    @ManyToOne(() => Service, (service) => service.packageServices)
    service: Service;
}
