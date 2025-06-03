import { RolesNameEnum } from '@enums/index';
import { User } from '@modules/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RolesNameEnum,
    default: RolesNameEnum.CUSTOMER,
    name: 'name',
  })
  name: RolesNameEnum;

  @Column({ length: 60, nullable: true })
  description: string;

  // Relations
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
