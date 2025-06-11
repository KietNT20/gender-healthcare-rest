import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Question } from 'src/modules/questions/entities/question.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { Symptom } from 'src/modules/symptoms/entities/symptom.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeLevelColumn,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
@Index('idx_categories_is_active', ['isActive'])
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index('idx_categories_name')
  name: string;

  @Column({ length: 100, unique: true })
  @Index('idx_categories_slug')
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50 })
  @Index('idx_categories_type')
  type: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  @TreeLevelColumn()
  level: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @OneToMany(() => Service, (service) => service.category)
  services: Service[];

  @OneToMany(() => Blog, (blog) => blog.category)
  blogs: Blog[];

  @OneToMany(() => Question, (question) => question.category)
  questions: Question[];

  @OneToMany(() => Symptom, (symptom) => symptom.category)
  symptoms: Symptom[];
}
