import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blog_service_relations')
@Index('blog_service_relations_pkey', ['blogId', 'serviceId'])
export class BlogServiceRelation {
  @PrimaryColumn({ name: 'blog_id' })
  @Index('idx_blog_service_blog_id')
  blogId: string;

  @PrimaryColumn({ name: 'service_id' })
  @Index('idx_blog_service_service_id')
  serviceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Blog, (blog) => blog.blogServiceRelations)
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne(() => Service, (service) => service.blogServiceRelations)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
