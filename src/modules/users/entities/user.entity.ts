import { GenderType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { AuditLog } from 'src/modules/audit-logs/entities/audit-log.entity';
import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import { Question } from 'src/modules/chat/entities/question.entity';
import { ConsultantAvailability } from 'src/modules/consultant-availability/entities/consultant-availability.entity';
import { ConsultantProfile } from 'src/modules/consultant-profiles/entities/consultant-profile.entity';
import { ContraceptiveReminder } from 'src/modules/contraceptive-reminders/entities/contraceptive-reminder.entity';
import { Document } from 'src/modules/documents/entities/document.entity';
import { EmploymentContract } from 'src/modules/employment-contracts/entities/employment-contract.entity';
import { Feedback } from 'src/modules/feedbacks/entities/feedback.entity';
import { Image } from 'src/modules/images/entities/image.entity';
import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { MenstrualPrediction } from 'src/modules/menstrual-predictions/entities/menstrual-prediction.entity';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 60, unique: true })
    @Index()
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password?: string;

    @Column({ type: 'varchar', nullable: true })
    @Index()
    googleId?: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    lastName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    @Index()
    slug: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({
        type: 'enum',
        enum: GenderType,
        nullable: true,
    })
    gender?: GenderType;

    @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
    @Index()
    phone?: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({
        type: 'varchar',
        length: 1024,
        nullable: true,
    })
    profilePicture?: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    accountLockedUntil?: Date;

    @Column({ default: 0 })
    loginAttempts: number;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    emailVerificationToken?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    emailVerificationExpires?: Date;

    @Column({ default: false })
    phoneVerified: boolean;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    passwordResetToken?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    passwordResetExpires?: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    lastLogin?: Date;

    @Column({ type: 'varchar', length: 10, default: 'vi' })
    locale: string;

    @Column({
        type: 'jsonb',
        default: { sms: false, push: true, email: true },
    })
    notificationPreferences: {
        sms: boolean;
        push: boolean;
        email: boolean;
    };
    @Column({ default: false })
    healthDataConsent: boolean;

    @Column({
        length: 255,
        nullable: true,
        select: false,
    })
    refreshToken?: string;

    @Column({ nullable: true })
    deletedByUserId?: string;

    @Column({ default: 0 })
    version: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    roleId?: string;

    // Relations
    // @ManyToOne(() => Role, (role) => role.users, {
    //     eager: true,
    // })
    // role: Role;

    @ManyToOne(() => Role, (role) => role.users, { nullable: true })
    role: Role;

    // Consultant Profile relation
    @OneToOne(() => ConsultantProfile, (profile) => profile.user, {
        nullable: true,
    })
    consultantProfile?: ConsultantProfile;

    // Consultant Availability relations
    @OneToMany(
        () => ConsultantAvailability,
        (availability) => availability.consultantProfile,
        { nullable: true },
    )
    consultantAvailabilities?: ConsultantAvailability[];

    // Appointment relations
    @OneToMany(() => Appointment, (appointment) => appointment.user)
    appointments: Appointment[];

    @OneToMany(() => Appointment, (appointment) => appointment.consultant)
    consultantAppointments: Appointment[];

    // Blog relations
    @OneToMany(() => Blog, (blog) => blog.author)
    authoredBlogs: Blog[];

    @OneToMany(() => Blog, (blog) => blog.reviewedByUser)
    reviewedBlogs: Blog[];

    @OneToMany(() => Blog, (blog) => blog.publishedByUser)
    publishedBlogs: Blog[];

    // Question & Answer relations
    @OneToMany(() => Question, (question) => question.user)
    questions: Question[];

    @OneToMany(() => Message, (message) => message.sender)
    messages: Message[];

    // Feedback relations
    @OneToMany(() => Feedback, (feedback) => feedback.user)
    feedbacks: Feedback[];

    @OneToMany(() => Feedback, (feedback) => feedback.consultant)
    consultantFeedbacks: Feedback[];

    // Cycle tracking relations
    @OneToMany(() => MenstrualCycle, (cycle) => cycle.user)
    menstrualCycles: MenstrualCycle[];

    @OneToMany(() => ContraceptiveReminder, (reminder) => reminder.user)
    contraceptiveReminders: ContraceptiveReminder[];

    @OneToMany(() => MenstrualPrediction, (prediction) => prediction.user)
    menstrualPredictions: MenstrualPrediction[];

    // Payment relations
    @OneToMany(() => Payment, (payment) => payment.user)
    payments: Payment[];

    // Notification relations
    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];

    // Test result relations
    @OneToMany(() => TestResult, (testResult) => testResult.user)
    testResults: TestResult[];

    // Document & Image relations
    @OneToMany(() => Document, (document) => document.user)
    documents: Document[];

    @OneToMany(() => Image, (image) => image.user)
    images: Image[];

    // Audit log relations
    @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
    auditLogs: AuditLog[];

    // Employment contract relations
    @OneToMany(() => EmploymentContract, (contract) => contract.user)
    employmentContracts: EmploymentContract[];

    // Package subscription relations
    @OneToMany(
        () => UserPackageSubscription,
        (subscription) => subscription.user,
    )
    packageSubscriptions: UserPackageSubscription[];

    // Consultant profile verification relations
    @OneToMany(() => ConsultantProfile, (profile) => profile.verifiedBy)
    verifiedConsultantProfiles: ConsultantProfile[];
}
