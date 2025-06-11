import { ContractStatusType } from 'src/enums';
import { ContractFile } from 'src/modules/contract-files/entities/contract-file.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class EmploymentContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ length: 50 })
  contractNumber: string;

  @Column({ length: 50 })
  contractType: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ContractStatusType,
    default: ContractStatusType.PENDING,
  })
  @Index()
  status: ContractStatusType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  @Index()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.employmentContracts)
  @JoinColumn()
  user: User;

  @OneToMany(() => ContractFile, (contractFile) => contractFile.contract)
  contractFiles: ContractFile[];
}
