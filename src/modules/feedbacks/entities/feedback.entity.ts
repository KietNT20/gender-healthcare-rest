import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ConsultantProfile } from 'src/modules/consultant-profiles/entities/consultant-profile.entity';
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

@Entity('feedbacks')
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'integer' })
    @Index('idx_feedbacks_rating')
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ default: false, name: 'is_anonymous' })
    isAnonymous: boolean;

    @Column({ default: true, name: 'is_public' })
    isPublic: boolean;

    @Column({ type: 'text', nullable: true, name: 'staff_response' })
    staffResponse: string;

    @Column({ type: 'text', array: true, nullable: true })
    categories: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_feedbacks_deleted_at')
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.feedbacks)
    user: User;

    @ManyToOne(() => Service, (service) => service.feedbacks)
    service: Service;

    @ManyToOne(() => Appointment, (appointment) => appointment.feedbacks)
    appointment: Appointment;

    @ManyToOne(
        () => ConsultantProfile,
        (consultant) => consultant.consultantFeedbacks,
    )
    consultant: ConsultantProfile;
}
