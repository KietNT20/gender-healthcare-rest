import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
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
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    userId: string;

    @Column({ nullable: true })
    @Index()
    serviceId: string;

    @Column({ nullable: true })
    @Index()
    appointmentId: string;

    @Column({ nullable: true })
    @Index()
    consultantId: string;

    @Column({ type: 'integer' })
    @Index()
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ default: false })
    isAnonymous: boolean;

    @Column({ default: true })
    isPublic: boolean;

    @Column({ type: 'text', nullable: true })
    staffResponse: string;

    @Column({ type: 'text', array: true, nullable: true })
    categories: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    @Index()
    deletedAt: Date | null;

    // Relations
    @ManyToOne(() => User, (user) => user.feedbacks)
    @JoinColumn()
    user: User;

    @ManyToOne(() => Service)
    @JoinColumn()
    service: Service;

    @ManyToOne(() => Appointment, (appointment) => appointment.feedbacks)
    @JoinColumn()
    appointment: Appointment;

    @ManyToOne(() => User, (user) => user.consultantFeedbacks)
    @JoinColumn()
    consultant: User;
}
