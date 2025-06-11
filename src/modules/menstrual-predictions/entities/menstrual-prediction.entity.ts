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

<<<<<<< HEAD
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
    nullable: true })
  predictionAccuracy: number;

  @Column({ default: false })
  notificationSent: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true })
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
=======
    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ type: 'date', name: 'predicted_cycle_start' })
    predictedCycleStart: Date;

    @Column({ type: 'date', name: 'predicted_cycle_end' })
    predictedCycleEnd: Date;

    @Column({ type: 'date', name: 'predicted_fertile_start' })
    predictedFertileStart: Date;

    @Column({ type: 'date', name: 'predicted_fertile_end' })
    predictedFertileEnd: Date;

    @Column({ type: 'date', name: 'predicted_ovulation_date' })
    predictedOvulationDate: Date;

    @Column({
        type: 'decimal',
        precision: 4,
        scale: 2,
        nullable: true,
        name: 'prediction_accuracy',
    })
    predictionAccuracy: number;

    @Column({ default: false, name: 'notification_sent' })
    notificationSent: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
        name: 'notification_sent_at',
    })
    notificationSentAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.menstrualPredictions, {
        onDelete: 'CASCADE',
    })
    user: User;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




