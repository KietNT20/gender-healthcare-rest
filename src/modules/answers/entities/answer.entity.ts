import { Question } from '@modules/questions/entities/question.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
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
  questionId: string;

  @Column({ name: 'consultant_id', nullable: true })
  consultantId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false, name: 'is_accepted' })
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

  // Relations
  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => User, (user) => user.answers)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;
}
