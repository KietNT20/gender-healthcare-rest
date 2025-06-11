import { ContentStatusType } from 'src/enums';
import { BlogServiceRelation } from 'src/modules/blog-service-relations/entities/blog-service-relation.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('blogs')
@Index('idx_blogs_not_deleted', ['id'], { where: 'deleted_at IS NULL' })
export class Blog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 255, unique: true })
    @Index('idx_blogs_slug')
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'author_id', nullable: true })
    @Index('idx_blogs_author_id')
    authorId: string;

    @Column({
        type: 'enum',
        enum: ContentStatusType,
        default: ContentStatusType.DRAFT,
    })
    @Index('idx_blogs_status')
    status: ContentStatusType;

    @Column({ length: 255, nullable: true, name: 'featured_image' })
    featuredImage?: string;

    @Column({ type: 'text', array: true, nullable: true })
    tags: string[];

    @Column({ default: 0 })
    views: number;

    @Column({ length: 255, nullable: true, name: 'seo_title' })
    seoTitle: string;

    @Column({ type: 'text', nullable: true, name: 'seo_description' })
    seoDescription: string;

    @Column({ type: 'text', nullable: true })
    excerpt: string;

    @Column({ nullable: true, name: 'read_time' })
    readTime: number;

    @Column({ name: 'reviewed_by_id', nullable: true })
    @Index('idx_blogs_reviewed_by')
    reviewedById: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'review_date',
    })
    reviewDate: Date;

    @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
    rejectionReason: string;

    @Column({ type: 'text', nullable: true, name: 'revision_notes' })
    revisionNotes: string;

    @Column({ name: 'published_by_id', nullable: true })
    publishedById: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'published_at',
    })
    @Index('idx_blogs_published_at')
    publishedAt: Date;

    @Column({ name: 'category_id', nullable: true })
    categoryId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_blogs_deleted_at')
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.authoredBlogs, {
        eager: true,
    })
    author: User;

    @ManyToOne(() => Category)
    category: Category;
    @ManyToOne(() => User, (user) => user.reviewedBlogs)
    reviewedBy: User;

    @ManyToOne(() => User, (user) => user.publishedBlogs)
    publishedBy: User;

    @OneToMany(() => BlogServiceRelation, (relation) => relation.blog)
    blogServiceRelations: BlogServiceRelation[];
}
