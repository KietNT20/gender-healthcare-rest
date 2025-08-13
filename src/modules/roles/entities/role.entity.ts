import { RolesNameEnum } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: RolesNameEnum,
        default: RolesNameEnum.CUSTOMER,
        unique: true,
    })
    name: RolesNameEnum;

    @Column({ length: 60, nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Relations
    @OneToMany(() => User, (user) => user.role)
    users: User[];
}
