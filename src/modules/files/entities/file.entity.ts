import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum FileType {
    IMAGE = 'image',
    CONTRACT_FILE = 'contract_file',
    DOCUMENT = 'document',
}

export enum EntityType {
    USER = 'user',
    BLOG = 'blog',
    CONTRACT = 'contract',
    TEST_RESULT = 'test_result',
    SERVICE = 'service',
    APPOINTMENT = 'appointment',
    FEEDBACK = 'feedback',
}

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255 })
    originalName: string;

    @Column({ length: 100 })
    mimeType: string;

    @Column('bigint')
    size: number;

    @Column({ type: 'text' })
    path: string;

    @Column({ type: 'text', nullable: true })
    url?: string;

    @Column({
        type: 'enum',
        enum: FileType,
    })
    @Index()
    fileType: FileType;

    // Generic relation fields
    @Column({
        type: 'enum',
        enum: EntityType,
        nullable: true,
    })
    entityType?: EntityType;

    @Column({ type: 'uuid', nullable: true })
    entityId?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        // For images
        width?: number;
        height?: number;
        altText?: string;
        format?: string;

        // For documents
        documentType?: string;
        isSensitive?: boolean;
        isPublic?: boolean;

        // For any file
        description?: string;
        tags?: string[];
        [key: string]: any;
    };

    @Column({ default: false })
    isPublic: boolean;

    @Column({ default: false })
    isTemporary: boolean;

    @Column({ length: 64, nullable: true })
    hash?: string; // For duplicate detection

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
