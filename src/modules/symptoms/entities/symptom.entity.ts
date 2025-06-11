import { Category } from 'src/modules/categories/entities/category.entity';
import { CycleSymptom } from 'src/modules/cycle-symptoms/entities/cycle-symptom.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Symptom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.symptoms)
  @JoinColumn()
  category: Category;

  @OneToMany(() => CycleSymptom, (cycleSymptom) => cycleSymptom.symptom)
  cycleSymptoms: CycleSymptom[];
}




