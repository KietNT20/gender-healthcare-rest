import { Appointment } from '@modules/appointments/entities/appointment.entity';
import { Service } from '@modules/services/entities/service.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'service_id', nullable: true })
  serviceId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ name: 'consultant_id', nullable: true })
  consultantId: string;

  @Column()
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

  // Relations
  @ManyToOne(() => User, (user) => user.feedbacks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Appointment, (appointment) => appointment.feedbacks)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User, (user) => user.consultantFeedbacks)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;
}
