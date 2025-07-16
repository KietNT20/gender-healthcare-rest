import { QuestionStatusType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.questions)
    user: User;

    @OneToMany(() => Message, (message) => message.question, {
        cascade: true,
    })
    messages: Message[];

    @OneToOne(() => Appointment, (appointment) => appointment.question, {
        nullable: true,
    })
    appointment?: Appointment;
}
