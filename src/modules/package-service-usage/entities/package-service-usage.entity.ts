import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

/*
📌 Entity này là gì?
Ghi lại mỗi lần người dùng sử dụng một dịch vụ cụ thể nằm trong gói đã mua. Gắn với buổi tư vấn (appointment), loại dịch vụ, thời gian dùng.

📄 Mô tả các trường:
Trường	Mô tả
id	UUID
usageDate	Ngày sử dụng
createdAt, updatedAt	Metadata thời gian

🔗 Quan hệ:
@ManyToOne → UserPackageSubscription: thuộc gói nào của người dùng.

@ManyToOne → Service: dịch vụ được dùng.

@ManyToOne → Appointment: tư vấn nào được dùng (đại diện cho buổi sử dụng).*/

@Entity()
export class PackageServiceUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    usageDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(
        () => UserPackageSubscription,
        (subscription) => subscription.serviceUsages,
    )
    subscription: UserPackageSubscription;

    @ManyToOne(() => Service, (service) => service.packageServiceUsages)
    service: Service;

    @ManyToOne(
        () => Appointment,
        (appointment) => appointment.packageServiceUsages,
    )
    appointment: Appointment;
}
