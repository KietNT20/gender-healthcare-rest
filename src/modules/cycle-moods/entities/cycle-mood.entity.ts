import { MenstrualCycle } from '@modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from '@modules/moods/entities/mood.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => MenstrualCycle, (cycle) => cycle.cycleMoods)
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenstrualCycle;

  @ManyToOne(() => Mood, (mood) => mood.cycleMoods)
  @JoinColumn({ name: 'mood_id' })
  mood: Mood;
}
