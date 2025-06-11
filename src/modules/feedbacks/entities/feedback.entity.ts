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

@Entity()
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
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
=======
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
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', array: true, nullable: true })
    categories: string[];

<<<<<<< HEAD
  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  staffResponse: string;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_feedbacks_deleted_at')
    deletedAt?: Date;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    // Relations
    @ManyToOne(() => User, (user) => user.feedbacks)
    user: User;

<<<<<<< HEAD
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
=======
    @ManyToOne(() => Service, (service) => service.feedbacks)
    service: Service;

    @ManyToOne(() => Appointment, (appointment) => appointment.feedbacks)
    appointment: Appointment;

    @ManyToOne(
        () => ConsultantProfile,
        (consultant) => consultant.consultantFeedbacks,
    )
    consultant: ConsultantProfile;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




