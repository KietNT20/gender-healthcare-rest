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
    TreeParent,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
@Tree('closure-table')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    @Index()
    type: string;

    @Column({ default: true })
    isActive: boolean;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

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
