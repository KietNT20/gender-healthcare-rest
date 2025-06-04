import { Question } from '@modules/questions/entities/question.entity';
import { Tag } from '@modules/tags/entities/tag.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('question_tags')
export class QuestionTag {
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
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Tag, (tag) => tag.questionTags)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
