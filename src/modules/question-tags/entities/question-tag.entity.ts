import { Question } from 'src/modules/questions/entities/question.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import {
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class QuestionTag {
<<<<<<< HEAD
  @PrimaryColumn({ })
  questionId: string;

  @PrimaryColumn({ })
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
=======
    @PrimaryColumn({ name: 'question_id' })
    questionId: string;

    @PrimaryColumn({ name: 'tag_id' })
    tagId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Question, (question) => question.questionTags)
    question: Question;

    @ManyToOne(() => Tag, (tag) => tag.questionTags)
    tag: Tag;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




