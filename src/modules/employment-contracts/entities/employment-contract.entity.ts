import { ContractStatusType } from 'src/enums';
import { ContractFile } from 'src/modules/contract-files/entities/contract-file.entity';
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

@Entity('employment_contracts')
@Index('idx_employment_contracts_user_id', ['userId'])
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
    @Index('idx_employment_contracts_status')
    status: ContractStatusType;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    @Index('idx_employment_contracts_deleted_at')
    deletedAt: Date | null; // Relations
    @ManyToOne(() => User, (user) => user.employmentContracts)
    user: User;

    @OneToMany(() => ContractFile, (contractFile) => contractFile.contract)
    contractFiles: ContractFile[];
}
