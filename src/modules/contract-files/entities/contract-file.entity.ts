import { Document } from '@modules/documents/entities/document.entity';
import { EmploymentContract } from '@modules/employment-contracts/entities/employment-contract.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('contract_files')
export class ContractFile {
  @PrimaryColumn({ name: 'contract_id' })
  contractId: string;

  @PrimaryColumn({ name: 'file_id' })
  fileId: string;

  @Column({ length: 50, nullable: true, name: 'file_type' })
  fileType: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'upload_date',
  })
  uploadDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

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
