import { LocationTypeEnum, ProfileStatusType } from 'src/enums';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Certificates, WorkingHours } from './consultant-profile-data.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';

@Entity()
export class ConsultantProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 1024 })
    @Index()
    specialization: string;

    @Column({ type: 'text' })
    qualification: string;

    @Column({ type: 'text' })
    experience: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ type: 'jsonb', nullable: true })
    workingHours?: WorkingHours;

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

    @Column({ type: 'jsonb', nullable: true })
    certificates?: Certificates;

    @Column({ type: 'text', array: true, nullable: true })
    languages?: string[];

    @Column({ type: 'text', nullable: true })
    educationBackground?: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    consultationFee: number;

    @Column({ default: 10 })
    maxAppointmentsPerDay: number;

    @Column({ default: 0 })
    version: number;

    @Column({ default: false })
    isVerified: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    verifiedAt?: Date;

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
    deletedAt?: Date;

    // Relations
    @OneToOne(() => User, (user) => user.consultantProfile)
    @JoinColumn()
    user: User;

    @ManyToOne(() => User, (user) => user.verifiedConsultantProfiles, {
        nullable: true,
    })
    verifiedBy: User;

    @OneToMany(
        () => ConsultantAvailability,
        (availability) => availability.consultantProfile,
    )
    availabilities: ConsultantAvailability[];



    @OneToMany(() => Feedback, (feedback) => feedback.consultant)
    consultantFeedbacks: Feedback[];
}



