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

@Entity()
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255 })
    originalName: string;

    @Column({ length: 100 })
    mimeType: string;

    @Column()
    size: number;

    @Column({ type: 'text' })
    path: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 50, nullable: true })
    @Index()
    documentType?: string;

    @Column({ length: 50, nullable: true })
    entityType?: string;

    @Column({ type: 'uuid', nullable: true })
    entityId?: string;

    @Column({ default: false })
    isPublic: boolean;

    @Column({ default: false })
    isSensitive: boolean;

    @Column({ length: 64, nullable: true })
    hash?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.documents)
    user: User;

    @OneToMany(() => ContractFile, (contractFile) => contractFile.file)
    contractFiles: ContractFile[];
}
