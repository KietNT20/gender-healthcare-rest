import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index('idx_audit_logs_entity', ['entityType', 'entityId'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    @Index('idx_audit_logs_action')
    action: string;

    @Column({ length: 50, name: 'entity_type' })
    entityType: string;

    @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
    entityId: string;

    @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
    oldValues: any;

    @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
    newValues: any;

    @Column({ type: 'text', nullable: true, name: 'user_agent' })
    userAgent: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ length: 20, default: 'success' })
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    @Index('idx_audit_logs_created_at')
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.auditLogs)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
