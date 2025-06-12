import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from 'src/modules/categories/entities/category.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { PackageServiceUsage } from 'src/modules/package-service-usage/entities/package-service-usage.entity';
import { PackageService } from 'src/modules/package-services/entities/package-service.entity';

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  duration: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  images?: string[];

  @Column({ length: 255, nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  prerequisites?: string;

  @Column({ type: 'text', nullable: true })
  postInstructions?: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  // Truy vấn nhanh qua ID nếu không join Category
  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.services)   
  category: Category;

  @OneToMany(() => Feedback, (feedback) => feedback.service)
  feedbacks: Feedback[];

  @OneToMany(() => PackageService, (packageService) => packageService.service)
  packageServices: PackageService[];

  @OneToMany(() => PackageServiceUsage, (usage) => usage.service)
  packageServiceUsages: PackageServiceUsage[];
}
