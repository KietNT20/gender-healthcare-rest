import { QuestionStatusType } from 'src/enums';
import { Answer } from 'src/modules/answers/entities/answer.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { QuestionTag } from 'src/modules/question-tags/entities/question-tag.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('questions')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 255, unique: true })
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: QuestionStatusType,
    })
    status: QuestionStatusType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null;
    @ManyToOne(() => User, (user) => user.questions)
    user: User;

    @ManyToOne(() => Category, (category) => category.questions)
    category: Category;

    @OneToMany(() => Answer, (answer) => answer.question)
    answers: Answer[];

    @OneToMany(() => QuestionTag, (questionTag) => questionTag.question)
    questionTags: QuestionTag[];
}
