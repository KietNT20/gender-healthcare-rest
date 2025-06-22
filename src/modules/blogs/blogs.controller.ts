import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { BlogsService } from './blogs.service';
import { BlogQueryDto } from './dto/blog-query.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogImageService } from './blogs-image.service';
import { CreateBlogImageDTO } from './dto/create-blog-image.dto';

@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly blogImageService: BlogImageService,
    ) {}

    @Post()
    @UseGuards(RoleGuard, JwtAuthGuard)
    @ApiBearerAuth()
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({ summary: 'Create a new blog' })
    @ApiResponse({ status: 201, description: 'Blog created successfully' })
    @ResponseMessage('Blog created successfully')
    create(@Body() createBlogDto: CreateBlogDto) {
        return this.blogsService.create(createBlogDto);
    }

    @Get()
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
    findBySlug(@Param('slug') slug: string) {
        return this.blogsService.findBySlug(slug);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get blog by ID' })
    @ApiResponse({ status: 200, description: 'Blog retrieved successfully' })
    @ResponseMessage('Blog retrieved successfully')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.blogsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(RoleGuard, JwtAuthGuard)
    @ApiBearerAuth()
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Update blog by ID (Admin/Manager only)' })
    @ApiResponse({ status: 200, description: 'Blog updated successfully' })
    @ResponseMessage('Blog updated successfully')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateBlogDto: UpdateBlogDto,
    ) {
        return this.blogsService.update(id, updateBlogDto);
    }

    @Delete(':id')
    @UseGuards(RoleGuard, JwtAuthGuard)
    @ApiBearerAuth()
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

    @Patch('/image/:id')
    @ApiOperation({ summary: 'Synchronize image to blog' })
    async syncBlogImages(@Param('id', ParseUUIDPipe) id: string) {
        return this.blogImageService.syncBlogImages(id);
    }

    @Post('/image')
    @ApiOperation({ summary: 'Add image to blog' })
    async addImageToBlog(@Body() createBlogImageDTO: CreateBlogImageDTO) {
        return this.blogImageService.addImageToBlog(createBlogImageDTO);
    }

    @Put('/image')
    @ApiOperation({ summary: 'Delete image from blog' })
    async removeImageFromBlog(@Body() createBlogImageDTO: CreateBlogImageDTO) {
        return this.blogImageService.removeImageFromBlog(createBlogImageDTO);
    }
}
