import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from 'src/modules/symptoms/entities/symptom.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CycleSymptom {
  @PrimaryColumn({ })
  @Index()
  cycleId: string;

  @PrimaryColumn({ })
  @Index()
  symptomId: string;

  @Column({ nullable: true })
  intensity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms)
  @JoinColumn()
  cycle: MenstrualCycle;

  @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms)
  @JoinColumn()
  symptom: Symptom;
}




