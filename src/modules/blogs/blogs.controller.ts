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
import { User } from 'src/modules/users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlogImageService } from './blogs-image.service';
import { BlogsService } from './blogs.service';
import { BlogQueryDto } from './dto/blog-query.dto';
import { CreateBlogImageDTO } from './dto/create-blog-image.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { PublishBlogDto } from './dto/publish-blog.dto';
import { ReviewBlogDto } from './dto/review-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly blogImageService: BlogImageService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new blog' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Blog created successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, Manager, or Consultant only).',
    })
    @ResponseMessage('Blog created successfully')
    create(
        @Body() createBlogDto: CreateBlogDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.blogsService.create(createBlogDto, currentUser.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all published blogs (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Published blogs retrieved successfully',
    })
    @ResponseMessage('Published blogs retrieved successfully')
    findAll(@Query() queryDto: BlogQueryDto) {
        return this.blogsService.findAll(queryDto);
    }

    @Get('published')
    @ApiOperation({ summary: 'Get all published blogs (Public access)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Published blogs retrieved successfully',
    })
    @ResponseMessage('Published blogs retrieved successfully')
    findAllPublished(@Query() queryDto: BlogQueryDto) {
        return this.blogsService.findAllPublished(queryDto);
    }

    @Get('slug/:slug')
    @ApiOperation({
        summary: 'Get published blog by slug (Public access with view count)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Published blog retrieved successfully',
    })
    @ResponseMessage('Published blog retrieved successfully')
    findPublishedBySlug(@Param('slug') slug: string) {
        return this.blogsService.findBySlug(slug, true);
    }

    @Get('pending-review')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all blogs pending review (Admin/Manager only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Pending review blogs retrieved successfully',
    })
    @ResponseMessage('Pending review blogs retrieved successfully')
    findAllPendingReview(@Query() queryDto: BlogQueryDto) {
        return this.blogsService.findAllPendingReview(queryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get blog by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog retrieved successfully',
    })
    @ResponseMessage('Blog retrieved successfully')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.blogsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update blog by ID (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog updated successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    @ResponseMessage('Blog updated successfully')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateBlogDto: UpdateBlogDto,
    ) {
        return this.blogsService.update(id, updateBlogDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete blog (Admin or Manager only)' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Blog deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
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

    @Patch(':id/view')
    @ApiOperation({ summary: 'Increment blog view count' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog view count incremented successfully',
    })
    @ResponseMessage('Blog view count incremented successfully')
    async incrementViewCount(@Param('id', ParseUUIDPipe) id: string) {
        return this.blogsService.incrementViewCount(id);
    }

    @Patch(':id/submit-review')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit blog for review (Author only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog submitted for review successfully',
    })
    @ResponseMessage('Blog submitted for review successfully')
    async submitForReview(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.blogsService.submitForReview(id, currentUser.id);
    }

    @Patch(':id/review')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Review blog (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog reviewed successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    @ResponseMessage('Blog reviewed successfully')
    async reviewBlog(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() reviewBlogDto: ReviewBlogDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.blogsService.reviewBlog(id, reviewBlogDto, currentUser.id);
    }

    @Patch(':id/publish')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish approved blog (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog published successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin or Manager only).',
    })
    @ResponseMessage('Blog published successfully')
    async publishBlog(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() publishBlogDto: PublishBlogDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.blogsService.publishBlog(
            id,
            publishBlogDto,
            currentUser.id,
        );
    }

    @Patch(':id/archive')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Archive blog (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Blog archived successfully',
    })
    @ResponseMessage('Blog archived successfully')
    async archiveBlog(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.blogsService.archiveBlog(id, currentUser.id);
    }
}
