import { ConsultantProfile } from 'src/modules/consultant-profiles/entities/consultant-profile.entity';
import { Question } from 'src/modules/questions/entities/question.entity';
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
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => Question, (question) => question.answers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'question_id' })
    question: Question;

    @ManyToOne(
        () => ConsultantProfile,
        (consultantProfile) => consultantProfile.answers,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn()
    consultantProfile: ConsultantProfile;
}
