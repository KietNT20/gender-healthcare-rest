import { GenderType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { AuditLog } from 'src/modules/audit-logs/entities/audit-log.entity';
import { Blog } from 'src/modules/blogs/entities/blog.entity';
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
import { Question } from 'src/modules/questions/entities/question.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
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

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 60, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 60, select: false })
    password: string;

    @Column({ type: 'varchar', length: 255, name: 'full_name' })
    fullName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

    @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
    dateOfBirth: Date;

    @Column({
        type: 'enum',
        enum: GenderType,
        nullable: true,
    })
    gender?: GenderType;

    @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
    phone?: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({
        type: 'varchar',
        length: 1024,
        nullable: true,
        name: 'profile_picture',
    })
    profilePicture?: string;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'account_locked_until',
    })
    accountLockedUntil?: Date;

    @Column({ default: 0, name: 'login_attempts' })
    loginAttempts: number;

    @Column({ default: false, name: 'email_verified' })
    emailVerified: boolean;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
        name: 'email_verification_token',
    })
    emailVerificationToken?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'email_verification_expires',
    })
    emailVerificationExpires?: Date;

    @Column({ default: false, name: 'phone_verified' })
    phoneVerified: boolean;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
        name: 'password_reset_token',
    })
    passwordResetToken?: string;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'password_reset_expires',
    })
    passwordResetExpires?: Date;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'last_login',
    })
    lastLogin?: Date;

    @Column({ type: 'varchar', length: 10, default: 'vi' })
    locale: string;

    @Column({
        type: 'jsonb',
        default: { sms: false, push: true, email: true },
        name: 'notification_preferences',
    })
    notificationPreferences: {
        sms: boolean;
        push: boolean;
        email: boolean;
    };

    @Column({ default: false, name: 'health_data_consent' })
    healthDataConsent: boolean;

    @Column({
        length: 255,
        nullable: true,
        name: 'refresh_token',
        select: false,
    })
    refreshToken?: string;

    @Column({ default: 0 })
    version: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;

    // Relations
    @OneToOne(() => Role, {
        eager: true,
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deleted_by_user_id' })
    deletedBy?: User;

    // Consultant Profile relation
    @OneToOne(() => ConsultantProfile, (profile) => profile.user)
    @JoinColumn()
    consultantProfile: ConsultantProfile;

    // Blog relations
    @OneToMany(() => Blog, (blog) => blog.author)
    authoredBlogs: Blog[];

    @OneToMany(() => Blog, (blog) => blog.publishedBy)
    publishedBlogs: Blog[];

    @OneToMany(() => Blog, (blog) => blog.reviewedBy)
    reviewedBlogs: Blog[];

    // Appointment relations
    @OneToMany(() => Appointment, (appointment) => appointment.user)
    appointments: Appointment[];

    // Question & Answer relations
    @OneToMany(() => Question, (question) => question.user)
    questions: Question[];

    @OneToMany(() => Feedback, (feedback) => feedback.user)
    feedbacks: Feedback[];

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
    @OneToMany(() => TestResult, (testResult) => testResult.staff)
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
}
