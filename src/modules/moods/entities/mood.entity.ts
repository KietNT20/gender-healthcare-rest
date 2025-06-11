import { CycleMood } from 'src/modules/cycle-moods/entities/cycle-mood.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Mood {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

<<<<<<< HEAD
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    // Relations
    @OneToMany(() => CycleMood, (cycleMood) => cycleMood.mood)
    cycleMoods: CycleMood[];
}




