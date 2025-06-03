import { ContractStatusType } from '@enums/index';
import { ContractFile } from '@modules/contract-files/entities/contract-file.entity';
import { User } from '@modules/users/entities/user.entity';
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

@Entity('employment_contracts')
export class EmploymentContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 50, name: 'contract_number' })
  contractNumber: string;

  @Column({ length: 50, name: 'contract_type' })
  contractType: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ContractStatusType,
    default: ContractStatusType.PENDING,
  })
  status: ContractStatusType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.employmentContracts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ContractFile, (contractFile) => contractFile.contract)
  contractFiles: ContractFile[];
}
