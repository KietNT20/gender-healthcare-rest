import { LocationTypeEnum, ProfileStatusType } from 'src/enums';
import { Answer } from 'src/modules/answers/entities/answer.entity';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Certificates, WorkingHours } from './consultant-profile-data.entity';

@Entity()
export class ConsultantProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
  @Column()
  @Index()
  userId: string;

  @Column({ length: 255 })
  @Index()
  specialization: string;
=======
    @Column({ length: 255 })
    @Index('idx_consultant_profiles_specialization')
    specialization: string;

    @Column({ type: 'text' })
    qualification: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text' })
    experience: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'jsonb', nullable: true, name: 'working_hours' })
    workingHours: WorkingHours;

<<<<<<< HEAD
  @Column({ type: 'jsonb', nullable: true })
  workingHours: WorkingHours;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @Index()
  rating: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({
    type: 'enum',
    enum: ProfileStatusType,
    default: ProfileStatusType.ACTIVE,
  })
  @Index()
  profileStatus: ProfileStatusType;
=======
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    @Index('idx_consultant_profiles_rating')
    rating: number;

    @Column({ default: true, name: 'is_available' })
    isAvailable: boolean;

    @Column({
        type: 'enum',
        enum: ProfileStatusType,
        default: ProfileStatusType.ACTIVE,
        name: 'profile_status',
    })
    @Index('idx_consultant_profiles_status')
    profileStatus: ProfileStatusType;

    @Column({ type: 'jsonb', nullable: true })
    certificates: Certificates;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', array: true, nullable: true })
    languages: string[];

    @Column({ type: 'text', nullable: true, name: 'education_background' })
    educationBackground: string;

<<<<<<< HEAD
  @Column({ type: 'text', nullable: true })
  educationBackground: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  consultationFee: number;

  @Column({ default: 10 })
  maxAppointmentsPerDay: number;
=======
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
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ default: false, name: 'is_verified' })
    isVerified: boolean;

<<<<<<< HEAD
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  verifiedAt: Date;

  @Column({
    type: 'enum',
    enum: LocationTypeEnum,
    array: true,
    default: [LocationTypeEnum.OFFICE],
  })
  consultationTypes: LocationTypeEnum[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @Index()
  deletedAt: Date | null;

  // Relations
  @OneToOne(() => User, (user) => user.consultantProfile)
  @JoinColumn()
  user: User;

  @ManyToOne(() => User, (user) => user.verifiedConsultantProfiles, {
    nullable: true,
  })
  @JoinColumn()
  verifiedBy: User;
=======
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

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_consultant_profiles_deleted_at')
    deletedAt?: Date;

    // Relations
    @OneToOne(() => User, (user) => user.consultantProfile)
    user: User;

    @OneToMany(
        () => ConsultantAvailability,
        (availability) => availability.consultantProfile,
    )
    availabilities: ConsultantAvailability[];

    @OneToMany(() => Appointment, (appointment) => appointment.consultant)
    consultantAppointments: Appointment[];

    @OneToMany(() => Answer, (answer) => answer.consultantProfile)
    answers: Answer[];
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    // Feedback relations
    @OneToMany(() => Feedback, (feedback) => feedback.consultant)
    consultantFeedbacks: Feedback[];
}
