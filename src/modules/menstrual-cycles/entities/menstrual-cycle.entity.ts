import { CycleMood } from 'src/modules/cycle-moods/entities/cycle-mood.entity';
import { CycleSymptom } from 'src/modules/cycle-symptoms/entities/cycle-symptom.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MenstrualCycle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

<<<<<<< HEAD
  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'date' })
  @Index()
  cycleStartDate: Date;

  @Column({ type: 'date', nullable: true })
  cycleEndDate: Date;

  @Column({ nullable: true })
  cycleLength: number;

  @Column({ nullable: true })
  periodLength: number;
=======
    @Column({ name: 'user_id', nullable: true })
    @Index('idx_menstrual_cycles_user_id')
    userId: string;

    @Column({ type: 'date', name: 'cycle_start_date' })
    @Index('idx_menstrual_cycles_start_date')
    cycleStartDate: Date;

    @Column({ type: 'date', nullable: true, name: 'cycle_end_date' })
    cycleEndDate: Date;

    @Column({ nullable: true, name: 'cycle_length' })
    cycleLength: number;

    @Column({ nullable: true, name: 'period_length' })
    periodLength: number;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', array: true, nullable: true })
    symptoms: string[];

    @Column({ type: 'text', nullable: true })
    notes: string;

<<<<<<< HEAD
  @Column({ nullable: true })
  flowIntensity: number;
=======
    @Column({ nullable: true, name: 'flow_intensity' })
    flowIntensity: number;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', array: true, nullable: true })
    mood: string[];

<<<<<<< HEAD
  @Column({ nullable: true })
  painLevel: number;

  @Column({
    type: 'text',
    array: true,
    nullable: true })
  medicationTaken: string[];
=======
    @Column({ nullable: true, name: 'pain_level' })
    painLevel: number;

    @Column({
        type: 'text',
        array: true,
        nullable: true,
        name: 'medication_taken',
    })
    medicationTaken: string[];
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
    temperature: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    weight: number;

<<<<<<< HEAD
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @Index()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.menstrualCycles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_menstrual_cycles_deleted_at')
    deletedAt: Date | null;

    // Relations
    @ManyToOne(() => User, (user) => user.menstrualCycles, {
        onDelete: 'CASCADE',
    })
    user: User;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @OneToMany(() => CycleMood, (cycleMood) => cycleMood.cycle)
    cycleMoods: CycleMood[];

    @OneToMany(() => CycleSymptom, (cycleSymptom) => cycleSymptom.cycle)
    cycleSymptoms: CycleSymptom[];
}




