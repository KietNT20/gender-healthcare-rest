import { MenstrualCycle } from '@modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from '@modules/moods/entities/mood.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('cycle_moods')
export class CycleMood {
  @PrimaryColumn({ name: 'cycle_id' })
  cycleId: string;

  @PrimaryColumn({ name: 'mood_id' })
  moodId: string;

  @Column({ nullable: true })
  intensity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenstrualCycle;

  @ManyToOne(() => Mood, (mood) => mood.cycleMoods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mood_id' })
  mood: Mood;
}
