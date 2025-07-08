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

    @Column({ type: 'date' })
    @Index()
    cycleStartDate: Date;

    @Column({ type: 'date', nullable: true })
    cycleEndDate?: Date;

    @Column({ nullable: true })
    cycleLength?: number;

    @Column({ nullable: true })
    periodLength?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    @Index()
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.menstrualCycles, {
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => CycleMood, (cycleMood) => cycleMood.cycle)
    cycleMoods: CycleMood[];

    @OneToMany(() => CycleSymptom, (cycleSymptom) => cycleSymptom.cycle)
    cycleSymptoms: CycleSymptom[];
}
