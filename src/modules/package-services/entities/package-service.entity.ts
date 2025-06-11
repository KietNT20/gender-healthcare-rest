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

@Entity()
export class PackageService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
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
    default: 0 })
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
=======
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
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




