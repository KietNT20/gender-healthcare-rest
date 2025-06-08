import { MenstrualCycle } from '@modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from '@modules/symptoms/entities/symptom.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms)
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenstrualCycle;

  @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms)
  @JoinColumn({ name: 'symptom_id' })
  symptom: Symptom;
}
