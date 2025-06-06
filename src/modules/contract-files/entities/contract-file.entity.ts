import { Document } from '@modules/documents/entities/document.entity';
import { EmploymentContract } from '@modules/employment-contracts/entities/employment-contract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contract_files')
export class ContractFile {
  @PrimaryColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn({ name: 'file_id' })
  fileId: string;

  @Column({ length: 50, nullable: true, name: 'file_type' })
  fileType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EmploymentContract, (contract) => contract.contractFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contract_id' })
  contract: EmploymentContract;

  @ManyToOne(() => Document, (document) => document.contractFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'file_id' })
  file: Document;
}
