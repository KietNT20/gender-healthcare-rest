import { Document } from 'src/modules/documents/entities/document.entity';
import { EmploymentContract } from 'src/modules/employment-contracts/entities/employment-contract.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContractFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, nullable: true })
    fileType?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => EmploymentContract, (contract) => contract.contractFiles, {
        onDelete: 'CASCADE',
    })
    contract: EmploymentContract;

    @ManyToOne(() => Document, (document) => document.contractFiles, {
        onDelete: 'CASCADE',
    })
    file: Document;
}
