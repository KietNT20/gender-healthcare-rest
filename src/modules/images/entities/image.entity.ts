import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
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

    @Column({ length: 255 })
    originalName: string;

    @Column()
    size: number;

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({ length: 10, nullable: true })
    format: string;

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

    @Column({ type: 'text', default: '' })
    url: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.images)
    @JoinColumn()
    user: User;
}
