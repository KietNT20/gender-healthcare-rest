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

@Entity('documents')
@Index('idx_documents_entity', ['entityId', 'entityType'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, name: 'original_name' })
  originalName: string;

  @Column({ length: 100, name: 'mime_type' })
  mimeType: string;

  @Column()
  size: number;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true, name: 'document_type' })
  @Index('idx_documents_document_type')
  documentType: string;

  @Column({ length: 50, nullable: true, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string;

  @Column({ default: false, name: 'is_public' })
  isPublic: boolean;

  @Column({ default: false, name: 'is_sensitive' })
  isSensitive: boolean;

  @Column({ name: 'user_id', nullable: true })
  @Index('idx_documents_user_id')
  userId: string;

  @Column({ length: 64, nullable: true })
  hash: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ContractFile, (contractFile) => contractFile.file)
  contractFiles: ContractFile[];
}
