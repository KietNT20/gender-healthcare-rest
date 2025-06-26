import { ContentStatusType } from 'src/enums';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Image } from 'src/modules/images/entities/image.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
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

    @Column({ type: 'varchar', length: 255, unique: true })
    @Index()
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

    @Column({ default: 0 })
    views: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    seoTitle?: string;

    @Column({ type: 'text', nullable: true })
    seoDescription?: string;

    @Column({ type: 'text', nullable: true })
    excerpt?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    reviewDate?: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'text', nullable: true })
    revisionNotes?: string;

    @Column({ type: 'text', nullable: true })
    publishNotes?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    @Index()
    publishedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    deletedByUserId?: string;

    
    @Column({ type: 'uuid',  nullable: true })
    authorId?: string;

    @Column({ type: 'uuid', nullable: true })
    categoryId?: string;

    @Column({ default: false })
    autoPublish: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.authoredBlogs)
    author: User;

    @ManyToOne(() => Category, (category) => category.blogs, {
        nullable: true,
        eager: true,
    })
    category: Category;

    @ManyToOne(() => User, (user) => user.reviewedBlogs, { nullable: true })
    reviewedByUser: User;

    @ManyToOne(() => User, (user) => user.publishedBlogs, {
        nullable: true,
        eager: true,
    })
    publishedByUser: User;

    @ManyToMany(() => Service, (service) => service.blogs, { eager: true })
    @JoinTable()
    services: Service[];

    @OneToMany(() => Image, (image) => image.blog, {
        eager: true,
        cascade: true,
    })
    images: Image[];

    @ManyToMany(() => Tag, (tag) => tag.blogs, { eager: true, cascade: true })
    @JoinTable()
    tags: Tag[];
}