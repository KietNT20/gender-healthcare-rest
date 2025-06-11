import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from 'src/modules/symptoms/entities/symptom.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CycleSymptom {
<<<<<<< HEAD
  @PrimaryColumn({ })
  @Index()
  cycleId: string;

  @PrimaryColumn({ })
  @Index()
  symptomId: string;
=======
    @PrimaryColumn({ name: 'cycle_id' })
    @Index('idx_cycle_symptoms_cycle_id')
    cycleId: string;

    @PrimaryColumn({ name: 'symptom_id' })
    @Index('idx_cycle_symptoms_symptom_id')
    symptomId: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ nullable: true })
    intensity: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

<<<<<<< HEAD
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
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms)
    cycle: MenstrualCycle;

    @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms)
    symptom: Symptom;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




