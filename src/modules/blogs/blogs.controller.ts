import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogQueryDto } from './dto/blog-query.dto';

import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@ApiBearerAuth()
@Controller('blogs')

export class BlogsController {
    constructor(private readonly blogsService: BlogsService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Create a new blog' })
    @ApiResponse({ status: 201, description: 'Blog created successfully' })
    @ResponseMessage('Blog created successfully')
    create(@Body() createBlogDto: CreateBlogDto){
        return this.blogsService.create(createBlogDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.STAFF,
        RolesNameEnum.CUSTOMER,
    ])
    @ApiOperation({ summary: 'Get all blogs with pagination and filters' })
    @ApiResponse({ status: 200, description: 'Blogs retrieved successfully' })
    @ResponseMessage('Blogs retrieved successfully')
    findAll(@Query() queryDto: BlogQueryDto) {
        return this.blogsService.findAll(queryDto);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get blog by slug' })
    @ApiResponse({ status: 200, description: 'Blog retrieved successfully' })
    @ResponseMessage('Blog retrieved successfully')
    findBySlug(@Param('slug') slug: string){
        return this.blogsService.findBySlug(slug);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.STAFF,
        RolesNameEnum.CUSTOMER,
    ])
    @ApiOperation({ summary: 'Get blog by ID' })
    @ApiResponse({ status: 200, description: 'Blog retrieved successfully' })
    @ResponseMessage('Blog retrieved successfully')
    findOne(@Param('id', ParseUUIDPipe) id: string){
        return this.blogsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Update blog by ID (Admin/Manager only)' })
    @ApiResponse({ status: 200, description: 'Blog updated successfully' })
@ResponseMessage('Blog updated successfully')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateBlogDto: UpdateBlogDto,
    ){
        return this.blogsService.update(id, updateBlogDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Soft delete blog (Admin only)' })
    @ApiResponse({ status: 200, description: 'Blog deleted successfully' })
    @ResponseMessage('Blog deleted successfully')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<{ message: string }> {
        await this.blogsService.remove(id, currentUser.id);
        return { message: 'Blog deleted successfully' };
    }
}