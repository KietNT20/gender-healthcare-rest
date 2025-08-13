import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from 'src/modules/symptoms/entities/symptom.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CycleSymptom {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    intensity?: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Relations
    @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleSymptoms)
    menstrualCycle: MenstrualCycle;

    @ManyToOne(() => Symptom, (symptom) => symptom.cycleSymptoms, {
        eager: true,
    })
    symptom: Symptom;
}
