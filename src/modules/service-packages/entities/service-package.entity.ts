import { PackageService } from 'src/modules/package-services/entities/package-service.entity';
import { UserPackageSubscription } from 'src/modules/user-package-subscriptions/entities/user-package-subscription.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
/*
Đại diện cho một gói sản phẩm có trả phí, được bán cho người dùng. Mỗi gói có nhiều dịch vụ con (ví dụ: Tư vấn dinh dưỡng, khám tâm lý...) và tồn tại trong một khoảng thời gian nhất định.

📄 Mô tả các trường:
Trường	Mô tả
id	UUID định danh duy nhất
name	Tên gói dịch vụ
slug	Mã định danh URL-friendly, dùng cho routing
description	Mô tả chi tiết nội dung gói
price	Giá bán gói (decimal)
durationMonths	Số tháng hiệu lực
isActive	Gói có còn khả dụng không
maxServicesPerMonth	Giới hạn lượt dùng dịch vụ mỗi tháng
createdAt, updatedAt, deletedAt	Metadata thời gian

🔗 Quan hệ:
@OneToMany → PackageService: gồm các dịch vụ nào.

@OneToMany → UserPackageSubscription: người dùng nào đã mua gói này.*/
@Entity()
export class ServicePackage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column()
    durationMonths: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    maxServicesPerMonth?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @OneToMany(() => PackageService, (packageService) => packageService.package)
    packageServices: PackageService[];

    @OneToMany(
        () => UserPackageSubscription,
        (subscription) => subscription.package,
    )
    subscriptions: UserPackageSubscription[];
}
