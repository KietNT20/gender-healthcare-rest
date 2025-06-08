import { Question } from 'src/modules/questions/entities/question.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id', nullable: true })
  @Index('idx_answers_question_id')
  questionId: string;

  @Column({ name: 'consultant_id', nullable: true })
  @Index('idx_answers_consultant_id')
  consultantId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false, name: 'is_accepted' })
  @Index('idx_answers_accepted')
  isAccepted: boolean;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column({ default: false, name: 'is_private' })
  isPrivate: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Index('idx_answers_deleted_at')
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => User, (user) => user.answers)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;
}
