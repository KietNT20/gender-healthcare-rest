import { LocationTypeEnum, ProfileStatusType } from '@enums/index';
import { ConsultantAvailability } from '@modules/consultant-availability/entities/consultant-availability.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('consultant_profiles')
export class ConsultantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 255 })
  specialization: string;

  @Column({ type: 'text' })
  qualification: string;

  @Column({ type: 'text' })
  experience: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', nullable: true, name: 'working_hours' })
  workingHours: any;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: true, name: 'is_available' })
  isAvailable: boolean;

  @Column({
    type: 'enum',
    enum: ProfileStatusType,
    default: ProfileStatusType.ACTIVE,
    name: 'profile_status',
  })
  profileStatus: ProfileStatusType;

  @Column({ type: 'jsonb', nullable: true })
  certificates: any;

  @Column({ type: 'text', array: true, nullable: true })
  languages: string[];

  @Column({ type: 'text', nullable: true, name: 'education_background' })
  educationBackground: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'consultation_fee',
  })
  consultationFee: number;

  @Column({ default: 10, name: 'max_appointments_per_day' })
  maxAppointmentsPerDay: number;

  @Column({ default: 0 })
  version: number;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ name: 'verified_by_id', nullable: true })
  verifiedById: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'verified_at',
  })
  verifiedAt: Date;

  @Column({
    type: 'enum',
    enum: LocationTypeEnum,
    array: true,
    default: [LocationTypeEnum.OFFICE],
    name: 'consultation_types',
  })
  consultationTypes: LocationTypeEnum[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.consultantProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.verifiedConsultantProfiles, {
    nullable: true,
  })
  @JoinColumn({ name: 'verified_by_id' })
  verifiedBy: User;

  @OneToMany(
    () => ConsultantAvailability,
    (availability) => availability.consultant,
  )
  availabilities: ConsultantAvailability[];
}
