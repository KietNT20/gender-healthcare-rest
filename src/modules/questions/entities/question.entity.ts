import { QuestionStatusType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Message } from 'src/modules/messages/entities/message.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: QuestionStatusType,
    })
    status: QuestionStatusType;

    @Column({ default: false })
    isAnonymous: boolean;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.questions)
    @JoinColumn()
    user: User;

    @ManyToOne(() => Category)
    @JoinColumn()
    category: Category;

    @OneToMany(() => Message, (message) => message.question)
    messages: Message[];

    @OneToOne(() => Appointment, (appointment) => appointment.question, {
        nullable: true,
    })
    appointment?: Appointment;
}
