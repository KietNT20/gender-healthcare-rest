import { Exclude } from 'class-transformer';
import { ContentStatusType } from 'src/enums';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Image } from 'src/modules/images/entities/image.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Blog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'uuid', nullable: true })
    deletedByUserId?: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    @Index()
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: ContentStatusType,
        default: ContentStatusType.DRAFT,
    })
    @Index()
    status: ContentStatusType;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    featuredImage?: string;

    @Column({ type: 'text', array: true, nullable: true })
    tags: string[];

    @Column({ default: 0 })
    views: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    seoTitle?: string;

    @Column({ type: 'text', nullable: true })
    seoDescription?: string;

    @Column({ type: 'text', nullable: true })
    excerpt?: string;

    @Column({ type: 'int', nullable: true })
    readTime?: number;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    reviewDate?: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'text', nullable: true })
    revisionNotes?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    @Index()
    publishedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
    @Column({ type: 'timestamp with time zone', nullable: true })
    @Exclude()
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.authoredBlogs)
    author: User;

    @ManyToOne(() => Category)
    category: Category;

    @ManyToOne(() => User, (user) => user.reviewedBlogs)
    reviewedByUser: User;

    @ManyToOne(() => User, (user) => user.publishedBlogs)
    publishedByUser: User;

    @ManyToMany(() => Service)
    @JoinTable()
    services: Service[];

    @OneToMany(() => Image, (image) => image.blog)
    images: Image[];
}
