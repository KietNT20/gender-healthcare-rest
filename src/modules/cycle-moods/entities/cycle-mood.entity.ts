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

@Entity()
export class CycleMood {
  @PrimaryColumn({ })
  @Index()
  cycleId: string;

  @PrimaryColumn({ })
  @Index()
  moodId: string;

  @Column({ nullable: true })
  intensity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

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
}




