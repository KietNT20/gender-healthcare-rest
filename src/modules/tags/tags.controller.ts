import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new tag' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tag created successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, Manager, or Consultant only).',
    })
    @ResponseMessage('Tag created successfully')
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagsService.create(createTagDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tags' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tags retrieved successfully',
    })
    @ResponseMessage('Tags retrieved successfully')
    findAll() {
        return this.tagsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tag by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tag retrieved successfully',
    })
    @ResponseMessage('Tag retrieved successfully')
    findOne(@Param('id') id: string) {
        return this.tagsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update tag by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tag updated successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    @ResponseMessage('Tag updated successfully')
    update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
        return this.tagsService.update(id, updateTagDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete tag by ID' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Tag deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, Manager only).',
    })
    @ResponseMessage('Tag deleted successfully')
    remove(@Param('id') id: string) {
        return this.tagsService.remove(id);
    }
}
