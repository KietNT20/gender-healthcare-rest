import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}

    async create(createRoleDto: CreateRoleDto) {
        const existingRole = await this.roleRepository.findOneBy({
            name: createRoleDto.name,
        });

        if (existingRole) {
            throw new ConflictException(
                `Role with name ${createRoleDto.name} already exists`,
            );
        }

        const role = this.roleRepository.create(createRoleDto);
        return this.roleRepository.save(role);
    }

    async findAll() {
        return this.roleRepository.find({
            where: { deletedAt: IsNull() },
        });
    }

    async findOne(id: string) {
        return this.roleRepository.findOneBy({ id, deletedAt: IsNull() });
    }

    async update(id: string, updateRoleDto: UpdateRoleDto) {
        const existingRole = await this.roleRepository.findOneBy({
            name: updateRoleDto.name,
        });

        if (existingRole && existingRole.id !== id) {
            throw new ConflictException(
                `Role with name ${updateRoleDto.name} already exists`,
            );
        }

        await this.roleRepository.update(id, {
            ...updateRoleDto,
            updatedAt: new Date(),
        });

        return this.roleRepository.findOneBy({ id });
    }

    async remove(id: string) {
        return this.roleRepository.softDelete(id);
    }
}
