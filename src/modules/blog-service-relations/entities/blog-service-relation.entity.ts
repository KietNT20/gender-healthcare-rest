import { Blog } from '@modules/blogs/entities/blog.entity';
import { Service } from '@modules/services/entities/service.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('blog_service_relations')
export class BlogServiceRelation {
  @PrimaryColumn({ name: 'blog_id' })
  blogId: string;

  @PrimaryColumn({ name: 'service_id' })
  serviceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Blog, (blog) => blog.blogServiceRelations)
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne(() => Service, (service) => service.blogServiceRelations)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
