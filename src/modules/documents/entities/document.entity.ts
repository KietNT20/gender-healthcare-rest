import { ContractFile } from '@modules/contract-files/entities/contract-file.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('documents')
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
  userId: string;

  @Column({ length: 64, nullable: true })
  hash: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ContractFile, (contractFile) => contractFile.file)
  contractFiles: ContractFile[];
}
