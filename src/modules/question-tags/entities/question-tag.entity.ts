import { Question } from 'src/modules/questions/entities/question.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class QuestionTag {
    @PrimaryColumn({})
    questionId: string;

    @PrimaryColumn({})
    tagId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Question, (question) => question.questionTags)
    @JoinColumn()
    question: Question;

    @ManyToOne(() => Tag, (tag) => tag.questionTags)
    @JoinColumn()
    tag: Tag;
}
