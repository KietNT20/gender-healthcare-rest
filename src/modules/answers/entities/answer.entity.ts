import { Question } from 'src/modules/questions/entities/question.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
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

    @ManyToOne(() => Question, (question) => question.answers, {
        onDelete: 'CASCADE',
    })
    question: Question;

    // @ManyToOne(
    //     () => ConsultantProfile,
    //     (consultantProfile) => consultantProfile.answers,
    //     {
    //         onDelete: 'CASCADE',
    //     },
    // )
    // consultantProfile: ConsultantProfile;
}
