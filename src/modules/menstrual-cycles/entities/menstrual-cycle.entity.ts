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

@Entity('menstrual_cycles')
export class MenstrualCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'date', name: 'cycle_start_date' })
  cycleStartDate: Date;

  @Column({ type: 'date', nullable: true, name: 'cycle_end_date' })
  cycleEndDate: Date;

  @Column({ nullable: true, name: 'cycle_length' })
  cycleLength: number;

  @Column({ nullable: true, name: 'period_length' })
  periodLength: number;

  @Column({ type: 'text', array: true, nullable: true })
  symptoms: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'flow_intensity' })
  flowIntensity: number;

  @Column({ type: 'text', array: true, nullable: true })
  mood: string[];

  @Column({ nullable: true, name: 'pain_level' })
  painLevel: number;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'medication_taken',
  })
  medicationTaken: string[];

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
