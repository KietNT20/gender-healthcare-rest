import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('menstrual_predictions')
export class MenstrualPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
