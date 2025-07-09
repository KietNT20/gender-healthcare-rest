import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Image } from 'src/modules/images/entities/image.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
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

    @Column({ default: false, name: 'is_anonymous' })
    isAnonymous: boolean;

    @Column({ default: true })
    isPublic: boolean;

    @Column({ type: 'text', nullable: true })
    staffResponse?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
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

    @OneToMany(() => Image, (image) => image.feedback, { eager: true })
    images: Image[];
}
