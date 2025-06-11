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

@Entity('cycle_symptoms')
@Index('cycle_symptoms_pkey', ['cycleId', 'symptomId'])
export class CycleSymptom {
    @PrimaryColumn({ name: 'cycle_id' })
    @Index('idx_cycle_symptoms_cycle_id')
    cycleId: string;

    @PrimaryColumn({ name: 'symptom_id' })
    @Index('idx_cycle_symptoms_symptom_id')
    symptomId: string;

    @Column({ nullable: true })
    intensity: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms)
    @JoinColumn({ name: 'cycle_id' })
    cycle: MenstrualCycle;

    @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms)
    @JoinColumn({ name: 'symptom_id' })
    symptom: Symptom;
}
