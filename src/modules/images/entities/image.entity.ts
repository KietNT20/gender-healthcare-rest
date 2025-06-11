import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Image {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

<<<<<<< HEAD
  @Column({ length: 255 })
  originalName: string;
=======
    @Column({ length: 255, name: 'original_name' })
    originalName: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column()
    size: number;

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({ length: 10, nullable: true })
    format: string;

<<<<<<< HEAD
  @Column({ length: 255, nullable: true })
  altText: string;

  @Column({ length: 50, nullable: true })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  @Index()
  userId: string;
=======
    @Column({ length: 255, nullable: true, name: 'alt_text' })
    altText: string;

    @Column({ length: 50, nullable: true, name: 'entity_type' })
    entityType: string;

    @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
    entityId: string;

    @Column({ default: false, name: 'is_public' })
    isPublic: boolean;

    @Column({ name: 'user_id', nullable: true })
    @Index('idx_images_user_id')
    userId: string;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8

    @Column({ type: 'text', default: '' })
    url: string;

<<<<<<< HEAD
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.images)
  @JoinColumn()
  user: User;
=======
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Relations
    @ManyToOne(() => User, (user) => user.images)
    user: User;
>>>>>>> 32dc73d01d2cb4e219acfc28d224170e1b513be8
}
