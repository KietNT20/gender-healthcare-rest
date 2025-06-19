import { Service } from 'src/modules/services/entities/service.entity';
import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PackageService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  quantityLimit?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => ServicePackage, (servicePackage) => servicePackage.packageServices) // Thay 'package' bằng 'servicePackage'
  package: ServicePackage;

  @ManyToOne(() => Service, (service) => service.packageServices)
  service: Service;
}