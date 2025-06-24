import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from 'src/modules/moods/entities/mood.entity';
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
export class CycleMood {
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

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods, {
        eager: true,
        cascade: true,
    })
    cycle: MenstrualCycle;

    @ManyToOne(() => Mood, (mood) => mood.cycleMoods, {
        eager: true,
        cascade: true,
    })
    mood: Mood;
}
