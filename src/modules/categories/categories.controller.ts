import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Category created successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    @ApiBearerAuth()
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of all categories.',
    })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category found successfully.',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category updated successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Category deleted successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.remove(id);
    }
}
