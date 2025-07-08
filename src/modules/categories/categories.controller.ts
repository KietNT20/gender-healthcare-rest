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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Category created successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all active categories' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of all active categories.',
    })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get('type/:type')
    @ApiOperation({ summary: 'Get categories by type' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Categories found by type.',
    })
    findByType(@Param('type') type: string) {
        return this.categoriesService.findByType(type);
    }

    @Get('tree/all')
    @ApiOperation({ summary: 'Get category tree structure' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category tree structure.',
    })
    getCategoryTree() {
        return this.categoriesService.getCategoryTree();
    }

    @Get('stats/counts')
    @ApiOperation({ summary: 'Get categories with item counts' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Categories with counts of related items.',
    })
    getCategoriesWithCounts() {
        return this.categoriesService.findCategoriesWithCounts();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get active category by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category found successfully.',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.findOne(id);
    }

    @Get(':id/services')
    @ApiOperation({ summary: 'Get all services in a category' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Services in category found successfully.',
    })
    getCategoryServices(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.getCategoryServices(id);
    }

    @Get(':id/blogs')
    @ApiOperation({ summary: 'Get all blogs in a category' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blogs in category found successfully.',
    })
    getCategoryBlogs(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.getCategoryBlogs(id);
    }

    @Get(':id/symptoms')
    @ApiOperation({ summary: 'Get all symptoms in a category' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Symptoms in category found successfully.',
    })
    getCategorySymptoms(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.getCategorySymptoms(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a category by ID' })
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
    @ApiOperation({ summary: 'Delete a category by ID' })
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
