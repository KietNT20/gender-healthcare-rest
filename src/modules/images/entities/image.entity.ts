import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, name: 'original_name' })
  originalName: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ length: 10, nullable: true })
  format: string;

  @Column({ length: 255, nullable: true, name: 'alt_text' })
  altText: string;

  @Column({ length: 50, nullable: true, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string;

  @Column({ default: false, name: 'is_public' })
  isPublic: boolean;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'text', default: '' })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.images)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
