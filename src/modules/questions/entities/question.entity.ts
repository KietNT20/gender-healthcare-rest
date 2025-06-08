import { QuestionStatusType } from '@enums/index';
import { Answer } from '@modules/answers/entities/answer.entity';
import { Category } from '@modules/categories/entities/category.entity';
import { QuestionTag } from '@modules/question-tags/entities/question-tag.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
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

  @Column({ default: false, name: 'is_public' })
  isPublic: boolean;

  @Column({ default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ default: false, name: 'is_anonymous' })
  isAnonymous: boolean;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.questions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

  @OneToMany(() => QuestionTag, (questionTag) => questionTag.question)
  questionTags: QuestionTag[];
}
