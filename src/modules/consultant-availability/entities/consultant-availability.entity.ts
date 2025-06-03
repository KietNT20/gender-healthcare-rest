import { LocationTypeEnum } from '@enums/index';
import { Appointment } from '@modules/appointments/entities/appointment.entity';
import { ConsultantProfile } from '@modules/consultant-profiles/entities/consultant-profile.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('consultant_availability')
export class ConsultantAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({ name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ default: true, name: 'is_available' })
  isAvailable: boolean;

  @Column({ default: 1, name: 'max_appointments' })
  maxAppointments: number;

  @Column({
    type: 'enum',
    enum: LocationTypeEnum,
    nullable: true,
  })
  location: LocationTypeEnum;

  @Column({ default: true })
  recurring: boolean;

  @Column({ type: 'date', nullable: true, name: 'specific_date' })
  specificDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.consultantAvailabilities)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @ManyToOne(() => ConsultantProfile, (profile) => profile.availabilities)
  @JoinColumn({ name: 'consultant_id', referencedColumnName: 'userId' })
  consultantProfile: ConsultantProfile;

  @OneToMany(() => Appointment, (appointment) => appointment.availability)
  appointments: Appointment[];
}
