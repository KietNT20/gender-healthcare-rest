import { Document } from 'src/modules/documents/entities/document.entity';
import { EmploymentContract } from 'src/modules/employment-contracts/entities/employment-contract.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContractFile {
<<<<<<< HEAD
  @PrimaryColumn({ })
  @Index()
  contractId: string;

  @PrimaryColumn({ })
  @Index()
  fileId: string;

  @Column({ length: 50, nullable: true })
  fileType: string;
=======
    @PrimaryColumn({ name: 'contract_id' })
    @Index('idx_contract_files_contract_id')
    contractId: string;

    @PrimaryColumn({ name: 'file_id' })
    @Index('idx_contract_files_file_id')
    fileId: string;

    @Column({ length: 50, nullable: true, name: 'file_type' })
    fileType: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', nullable: true })
    notes: string;

<<<<<<< HEAD
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EmploymentContract, (contract) => contract.contractFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  contract: EmploymentContract;

  @ManyToOne(() => Document, (document) => document.contractFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  file: Document;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(() => EmploymentContract, (contract) => contract.contractFiles, {
        onDelete: 'CASCADE',
    })
    contract: EmploymentContract;

    @ManyToOne(() => Document, (document) => document.contractFiles, {
        onDelete: 'CASCADE',
    })
    file: Document;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}




