import { QuestionStatusType } from 'src/enums';
import { Answer } from 'src/modules/answers/entities/answer.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: QuestionStatusType,
    })
    status: QuestionStatusType;

    @Column({ default: false })
    isPublic: boolean;

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: false })
    isAnonymous: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.questions)
    @JoinColumn()
    user: User;

    @ManyToOne(() => Category)
    @JoinColumn()
    category: Category;

    @OneToMany(() => Answer, (answer) => answer.question)
    answers: Answer[];

    @ManyToMany(() => Tag, (tag) => tag.questions)
    @JoinTable()
    tags: Tag[];
}
