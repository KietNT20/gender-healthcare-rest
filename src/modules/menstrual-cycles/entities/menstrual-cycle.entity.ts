import { CycleMood } from 'src/modules/cycle-moods/entities/cycle-mood.entity';
import { CycleSymptom } from 'src/modules/cycle-symptoms/entities/cycle-symptom.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MenstrualCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'date' })
  @Index()
  cycleStartDate: Date;

  @Column({ type: 'date', nullable: true })
  cycleEndDate: Date;

  @Column({ nullable: true })
  cycleLength: number;

  @Column({ nullable: true })
  periodLength: number;

  @Column({ type: 'text', array: true, nullable: true })
  symptoms: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  flowIntensity: number;

  @Column({ type: 'text', array: true, nullable: true })
  mood: string[];

  @Column({ nullable: true })
  painLevel: number;

  @Column({
    type: 'text',
    array: true,
    nullable: true })
  medicationTaken: string[];

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @Index()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.menstrualCycles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => CycleMood, (cycleMood) => cycleMood.cycle)
  cycleMoods: CycleMood[];

  @OneToMany(() => CycleSymptom, (cycleSymptom) => cycleSymptom.cycle)
  cycleSymptoms: CycleSymptom[];
}




