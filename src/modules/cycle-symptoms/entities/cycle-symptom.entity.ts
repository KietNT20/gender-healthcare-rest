import { MenstrualCycle } from '@modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from '@modules/symptoms/entities/symptom.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('cycle_symptoms')
export class CycleSymptom {
  @PrimaryColumn({ name: 'cycle_id' })
  cycleId: string;

  @PrimaryColumn({ name: 'symptom_id' })
  symptomId: string;

  @Column({ nullable: true })
  intensity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenstrualCycle;

  @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'symptom_id' })
  symptom: Symptom;
}
