import { PriorityType } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 50 })
    type: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    readAt: Date;

    @Column({ type: 'text', nullable: true })
    actionUrl: string;

    @Column({
        type: 'enum',
        enum: PriorityType,
        nullable: true,
    })
    priority: PriorityType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.notifications)
    user: User;
}
