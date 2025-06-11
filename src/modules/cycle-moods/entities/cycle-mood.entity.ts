import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from 'src/modules/moods/entities/mood.entity';
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
export class CycleMood {
<<<<<<< HEAD
  @PrimaryColumn({ })
  @Index()
  cycleId: string;

  @PrimaryColumn({ })
  @Index()
  moodId: string;
=======
    @PrimaryColumn({ name: 'cycle_id' })
    @Index('idx_cycle_moods_cycle_id')
    cycleId: string;

    @PrimaryColumn({ name: 'mood_id' })
    @Index('idx_cycle_moods_mood_id')
    moodId: string;
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
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods)
  @JoinColumn()
  cycle: MenstrualCycle;

  @ManyToOne(() => Mood, (mood) => mood.cycleMoods)
  @JoinColumn()
  mood: Mood;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods)
    cycle: MenstrualCycle;

    @ManyToOne(() => Mood, (mood) => mood.cycleMoods)
    mood: Mood;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




