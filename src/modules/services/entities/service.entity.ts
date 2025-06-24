import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { Image } from 'src/modules/images/entities/image.entity';
import { PackageServiceUsage } from 'src/modules/package-service-usage/entities/package-service-usage.entity';
import { PackageService } from 'src/modules/package-services/entities/package-service.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
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

    @Column({ default: true })
    isActive: boolean;

    @Column({ length: 255, nullable: true })
    shortDescription?: string;

    @Column({ type: 'text', nullable: true })
    prerequisites?: string;

    @Column({ type: 'text', nullable: true })
    postInstructions?: string;

    @Column({ default: false })
    featured: boolean;

    @Column({ type: 'text', array: true, nullable: true })
    specialties?: string[];

    @Column({ default: false })
    requiresConsultant: boolean;

    @Column({ default: 0 })
    version: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => Category, (category) => category.services, { eager: true })
    category: Category;

    @OneToMany(() => Feedback, (feedback) => feedback.service)
    feedbacks: Feedback[];

    @OneToMany(() => PackageService, (packageService) => packageService.service)
    packageServices: PackageService[];

    @OneToMany(() => PackageServiceUsage, (usage) => usage.service)
    packageServiceUsages: PackageServiceUsage[];

    @ManyToMany(() => Appointment, (appointment) => appointment.services)
    appointments: Appointment[];

    @ManyToMany(() => Blog, (blog) => blog.services)
    blogs: Blog[];

    @OneToMany(() => Image, (image) => image.service)
    images: Image[];
}
