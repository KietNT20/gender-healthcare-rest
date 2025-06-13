import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
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
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'integer' })
    @Index()
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ default: false })
    isAnonymous: boolean;

    @Column({ default: true })
    isPublic: boolean;

    @Column({ type: 'text', nullable: true })
    staffResponse?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    @Index()
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.feedbacks)
    user: User;

    @ManyToOne(() => Service, (service) => service.feedbacks)
    service: Service;

    @ManyToOne(() => Appointment, (appointment) => appointment.feedbacks)
    appointment: Appointment;

    @ManyToOne(() => User, (user) => user.consultantFeedbacks)
    consultant: User;
}
