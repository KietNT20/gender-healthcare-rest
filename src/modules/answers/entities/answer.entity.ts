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
    upVotes: number;

    @Column({ default: 0 })
    downVotes: number;

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
   
    @JoinColumn()
    question: Question;

   
    @JoinColumn()
    consultant: ConsultantProfile;
}
