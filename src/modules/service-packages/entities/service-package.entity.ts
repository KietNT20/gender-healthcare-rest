import { PackageService } from '@modules/package-services/entities/package-service.entity';
import { UserPackageSubscription } from '@modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('service_packages')
export class ServicePackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'duration_months' })
  durationMonths: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'max_services_per_month' })
  maxServicesPerMonth: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @OneToMany(() => PackageService, (packageService) => packageService.package)
  packageServices: PackageService[];

  @OneToMany(
    () => UserPackageSubscription,
    (subscription) => subscription.package,
  )
  subscriptions: UserPackageSubscription[];
}
