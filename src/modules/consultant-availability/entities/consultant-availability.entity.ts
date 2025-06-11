import { LocationTypeEnum } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ConsultantProfile } from 'src/modules/consultant-profiles/entities/consultant-profile.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
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
  @Index('idx_consultant_avail_consultant_id')
  consultantId: string;

  @Column({ name: 'day_of_week' })
  @Index('idx_consultant_avail_day')
  dayOfWeek: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ default: true, name: 'is_available' })
  @Index('idx_consultant_avail_is_available')
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

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => ConsultantProfile, (profile) => profile.availabilities)
  @JoinColumn({ name: 'consultant_id' })
  consultantProfile: ConsultantProfile;

  @OneToMany(() => Appointment, (appointment) => appointment.availability)
  appointments: Appointment[];
}
