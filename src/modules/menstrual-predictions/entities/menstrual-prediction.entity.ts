import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MenstrualPrediction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ type: 'date' })
    predictedCycleStart: Date;

    @Column({ type: 'date' })
    predictedCycleEnd: Date;

    @Column({ type: 'date' })
    predictedFertileStart: Date;

    @Column({ type: 'date' })
    predictedFertileEnd: Date;

    @Column({ type: 'date' })
    predictedOvulationDate: Date;

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
    notificationSentAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.menstrualPredictions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;
}
