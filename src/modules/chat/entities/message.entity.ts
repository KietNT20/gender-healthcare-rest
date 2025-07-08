import { MessageType } from 'src/enums';
import { Question } from 'src/modules/chat/entities/question.entity';
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

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    readAt?: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        fileId?: string;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        thumbnailUrl?: string;
        editedAt?: string;
        editCount?: number;
        replyTo?: string;
        mentions?: string[];
        publicUrl?: string; // Direct public URL for public PDFs
    };

    @Column({ default: false })
    isEdited: boolean;

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
