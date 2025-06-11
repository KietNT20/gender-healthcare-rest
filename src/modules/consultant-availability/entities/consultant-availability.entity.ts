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

@Entity()
export class ConsultantAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  consultantId: string;

  @Column()
  @Index()
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: true })
  @Index()
  isAvailable: boolean;

  @Column({ default: 1 })
  maxAppointments: number;

  @Column({
    type: 'enum',
    enum: LocationTypeEnum,
    nullable: true,
  })
  location: LocationTypeEnum;

  @Column({ default: true })
  recurring: boolean;

  @Column({ type: 'date', nullable: true })
  specificDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  // Foreign Keys
  @Column()
  consultantProfileId: string;

  // Relations
  @ManyToOne(() => ConsultantProfile, (profile) => profile.availabilities)
  @JoinColumn()
  consultantProfile: ConsultantProfile;

  @OneToMany(
    () => Appointment,
    (appointment) => appointment.consultantAvailability,
  )
  appointments: Appointment[];
}
