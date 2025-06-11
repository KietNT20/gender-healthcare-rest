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

@Entity()
export class Answer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    @Index()
    isAccepted: boolean;

    @Column({ default: 0 })
    upvotes: number;

    @Column({ default: 0 })
    downvotes: number;

    @Column({ default: false })
    isPrivate: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    @Index()
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => Question, (question) => question.answers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    question: Question;

    @ManyToOne(() => ConsultantProfile, (consultant) => consultant.answers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    consultant: ConsultantProfile;
}
