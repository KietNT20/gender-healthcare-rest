import { Document } from 'src/modules/documents/entities/document.entity';
import { EmploymentContract } from 'src/modules/employment-contracts/entities/employment-contract.entity';
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
export class ContractFile {
    @PrimaryColumn({})
    @Index()
    contractId: string;

    @PrimaryColumn({})
    @Index()
    fileId: string;

    @Column({ length: 50, nullable: true })
    fileType: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

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
}
