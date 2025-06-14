import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all roles' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a role by ID' })
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a role by ID' })
    @ResponseMessage('Role updated successfully')
    update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a role by ID' })
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
