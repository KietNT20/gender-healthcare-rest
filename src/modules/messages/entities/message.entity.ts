import { MessageType } from 'src/enums';
import { Question } from 'src/modules/questions/entities/question.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: MessageType,
        default: MessageType.TEXT,
    })
    type: MessageType;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @ManyToOne(() => Question, (question) => question.messages, {
        onDelete: 'CASCADE',
    })
    question: Question;

    @ManyToOne(() => User, (user) => user.messages, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    sender: User;
}
