import { SubscriptionStatusType } from 'src/enums';
import { PackageServiceUsage } from 'src/modules/package-service-usage/entities/package-service-usage.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
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

/*
📌 Entity này là gì?
Thể hiện việc người dùng đã mua gói dịch vụ nào, thời gian hiệu lực, trạng thái đăng ký, và lịch sử sử dụng liên quan.

📄 Mô tả các trường:
Trường	Mô tả
id	UUID
startDate, endDate	Thời gian hiệu lực
status	Trạng thái: ACTIVE, EXPIRED, CANCELED...
autoRenew	Có tự động gia hạn không
createdAt, updatedAt, deletedAt	Metadata thời gian

🔗 Quan hệ:
@ManyToOne → User: ai mua gói.

@ManyToOne → ServicePackage: mua gói nào.

@ManyToOne → Payment: thanh toán tương ứng.

@OneToMany → PackageServiceUsage: các lượt sử dụng trong gói.
*/
@Entity()
export class UserPackageSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: SubscriptionStatusType,
        default: SubscriptionStatusType.ACTIVE,
    })
    status: SubscriptionStatusType;

    @Column({ default: false })
    autoRenew: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.packageSubscriptions)
    user: User;

    @ManyToOne(
        () => ServicePackage,
        (servicePackage) => servicePackage.subscriptions,
    )
    package: ServicePackage;

    @ManyToOne(() => Payment, (payment) => payment.packageSubscriptions)
    payment: Payment;

    @OneToMany(() => PackageServiceUsage, (usage) => usage.subscription)
    serviceUsages: PackageServiceUsage[];
}
