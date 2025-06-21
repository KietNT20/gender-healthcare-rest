import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { ServicePackage } from '../../service-packages/entities/service-package.entity';

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

  @DeleteDateColumn({ nullable: true }) // Thêm DeleteDateColumn để hỗ trợ soft delete
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => ServicePackage, (servicePackage) => servicePackage.packageServices)
  package: ServicePackage;

  @ManyToOne(() => Service, (service) => service.packageServices)
  service: Service;
}