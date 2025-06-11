import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from 'src/modules/moods/entities/mood.entity';
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

@Entity('cycle_moods')
@Index('cycle_moods_pkey', ['cycleId', 'moodId'])
export class CycleMood {
  @PrimaryColumn({ name: 'cycle_id' })
  @Index('idx_cycle_moods_cycle_id')
  cycleId: string;

  @PrimaryColumn({ name: 'mood_id' })
  @Index('idx_cycle_moods_mood_id')
  moodId: string;

  @Column({ nullable: true })
  intensity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods)
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenstrualCycle;

  @ManyToOne(() => Mood, (mood) => mood.cycleMoods)
  @JoinColumn({ name: 'mood_id' })
  mood: Mood;
}
