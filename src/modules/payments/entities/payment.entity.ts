import { PaymentStatusType } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { GatewayResponseType } from '../types/gateway-response.type';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 50 })
    paymentMethod: string;

    @Column({
        type: 'enum',
        enum: PaymentStatusType,
        default: PaymentStatusType.PENDING,
    })
    status: PaymentStatusType;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    paymentDate: Date;

    @Column({ type: 'jsonb', nullable: true })
    gatewayResponse: GatewayResponseType;

    @Column({ default: false })
    refunded: boolean;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    })
    refundAmount: number;

    @Column({ type: 'text', nullable: true })
    refundReason: string;

    @Column({ length: 50, nullable: true })
    invoiceNumber?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.payments)
    user: User;

    @ManyToOne(() => Appointment, (appointment) => appointment.payments, {
        nullable: true,
    })
    appointment?: Appointment;

    @ManyToOne(
        () => ServicePackage,
        (servicePackage) => servicePackage.payments,
        { nullable: true },
    )
    servicePackage?: ServicePackage;

    @ManyToOne(() => Service, { nullable: true })
    service?: Service;

    @OneToMany(
        () => UserPackageSubscription,
        (subscription) => subscription.payment,
    )
    packageSubscriptions: UserPackageSubscription[];
}
