import { AppointmentService } from '@modules/appointment-services/entities/appointment-service.entity';
import { BlogServiceRelation } from '@modules/blog-service-relations/entities/blog-service-relation.entity';
import { Category } from '@modules/categories/entities/category.entity';
import { Feedback } from '@modules/feedbacks/entities/feedback.entity';
import { PackageServiceUsage } from '@modules/package-service-usage/entities/package-service-usage.entity';
import { PackageService } from '@modules/package-services/entities/package-service.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  duration: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  images: string[];

  @Column({ length: 255, nullable: true, name: 'short_description' })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  prerequisites: string;

  @Column({ type: 'text', nullable: true, name: 'post_instructions' })
  postInstructions: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  version: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(
    () => AppointmentService,
    (appointmentService) => appointmentService.service,
  )
  appointmentServices: AppointmentService[];

  @OneToMany(() => Feedback, (feedback) => feedback.service)
  feedbacks: Feedback[];

  @OneToMany(() => BlogServiceRelation, (relation) => relation.service)
  blogServiceRelations: BlogServiceRelation[];

  @OneToMany(() => PackageService, (packageService) => packageService.service)
  packageServices: PackageService[];

  @OneToMany(() => PackageServiceUsage, (usage) => usage.service)
  packageServiceUsages: PackageServiceUsage[];
}
