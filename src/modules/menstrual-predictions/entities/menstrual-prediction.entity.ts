import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MenstrualPrediction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Ngày bắt đầu chu kỳ kinh nguyệt dự đoán
    @Column({ type: 'date' })
    predictedCycleStart: Date;

    // Ngày kết thúc chu kỳ kinh nguyệt dự đoán
    @Column({ type: 'date' })
    predictedCycleEnd: Date;

    // Ngày bắt đầu thời kỳ rụng trứng dự đoán
    @Column({ type: 'date' })
    predictedFertileStart: Date;

    // Ngày kết thúc thời kỳ rụng trứng dự đoán
    @Column({ type: 'date' })
    predictedFertileEnd: Date;

    // Ngày rụng trứng dự đoán
    @Column({ type: 'date' })
    predictedOvulationDate: Date;

    // Độ chính xác của dự đoán (0.00 - 1.00)
    @Column({
        type: 'decimal',
        precision: 4,
        scale: 2,
        nullable: true,
    })
    predictionAccuracy: number;

    @Column({ default: false })
    notificationSent: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    notificationSentAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.menstrualPredictions)
    user: User;
}
