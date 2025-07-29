import {
    BadRequestException,
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
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFeedbackImageDTO } from './dto/create-feedback-image.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackImageService } from './feedbacks-image.service';
import { FeedbacksService } from './feedbacks.service';

@Controller('feedbacks')
export class FeedbacksController {
    constructor(
        private readonly feedbacksService: FeedbacksService,
        private readonly feedbackImageService: FeedbackImageService,
    ) {}

    /**
     * Create a new feedback
     * @param createDto Data to create a feedback
     * @param file Optional file upload for feedback
     * @returns Created feedback
     */
    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({ summary: 'Create a new feedback' })
    @ApiCreatedResponse({
        description: 'Feedback created successfully',
        type: CreateFeedbackDto,
    })
    @ApiBadRequestResponse({ description: 'Invalid data' })
    @ApiForbiddenResponse({
        description:
            'Forbidden: Only Customer, Staff, Manager, or Admin can perform this action',
    })
    @ApiBody({ type: CreateFeedbackDto })
    @ResponseMessage('Feedback created successfully')
    async create(@Body() createDto: CreateFeedbackDto) {
        return this.feedbacksService.create(createDto);
    }

    /**
     * Get a list of feedbacks with pagination and filters
     * @param queryDto Query parameters for pagination and filtering
     * @returns List of feedbacks with pagination metadata
     */
    @Get()
    @ApiOperation({
        summary: 'Get a list of feedbacks with pagination and filters',
    })
    @ApiResponse({
        status: 200,
        description: 'Feedbacks retrieved successfully',
    })
    @ResponseMessage('Feedbacks retrieved successfully')
    async findAll(@Query() queryDto: FeedbackQueryDto) {
        return this.feedbacksService.findAll(queryDto);
    }

    /**
     * Add image to feedback
     * @param createFeedbackImageDTO Data to add image to feedback
     * @returns Success message
     */
    @Post('/image')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({ summary: 'Add image to feedback' })
    @ApiResponse({ status: 200, description: 'Image added successfully' })
    @ResponseMessage('Image added successfully')
    async addImageToFeedback(
        @Body() createFeedbackImageDTO: CreateFeedbackImageDTO,
    ) {
        await this.feedbackImageService.addImageToFeedback(
            createFeedbackImageDTO,
        );
        return { message: 'Image added successfully' };
    }

    /**
     * Remove image from feedback
     * @param createFeedbackImageDTO Data to remove image from feedback
     * @returns Success message
     */
    @Put('/image')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Remove image from feedback' })
    @ApiResponse({ status: 200, description: 'Image removed successfully' })
    @ResponseMessage('Image removed successfully')
    async removeImageFromFeedback(
        @Body() createFeedbackImageDTO: CreateFeedbackImageDTO,
    ) {
        await this.feedbackImageService.removeImageFromFeedback(
            createFeedbackImageDTO,
        );
        return { message: 'Image removed successfully' };
    }

    /**
     * Get a feedback by ID
     * @param id Feedback ID
     * @returns Feedback details
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get a feedback by ID' })
    @ApiResponse({
        status: 200,
        description: 'Feedback retrieved successfully',
        type: CreateFeedbackDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
    @ApiResponse({ status: 404, description: 'Feedback not found' })
    @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
    @ResponseMessage('Feedback retrieved successfully')
    async findOne(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid feedback ID'),
            }),
        )
        id: string,
    ) {
        return this.feedbacksService.findOne(id);
    }

    /**
     * Update a feedback by ID
     * @param id Feedback ID
     * @param updateDto Data to update the feedback
     * @returns Updated feedback
     */
    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Update a feedback by ID' })
    @ApiResponse({
        status: 200,
        description: 'Feedback updated successfully',
        type: UpdateFeedbackDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
    @ApiResponse({ status: 404, description: 'Feedback not found' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Manager or Admin can perform this action',
    })
    @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
    @ApiBody({ type: UpdateFeedbackDto })
    @ResponseMessage('Feedback updated successfully')
    async update(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid feedback ID'),
            }),
        )
        id: string,
        @Body() updateDto: UpdateFeedbackDto,
    ) {
        return this.feedbacksService.update(id, updateDto);
    }

    /**
     * Soft delete a feedback by ID
     * @param id Feedback ID
     * @returns Success message
     */
    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Soft delete a feedback by ID' })
    @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
    @ApiResponse({ status: 404, description: 'Feedback not found' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin can perform this action',
    })
    @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
    @ResponseMessage('Feedback deleted successfully')
    async remove(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid feedback ID'),
            }),
        )
        id: string,
    ) {
        await this.feedbacksService.remove(id);
        return { message: 'Feedback deleted successfully' };
    }

    /**
     * Synchronize images to feedback
     * @param id Feedback ID
     * @returns Success message
     */
    @Patch('/image/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Synchronize images to feedback' })
    @ApiResponse({
        status: 200,
        description: 'Images synchronized successfully',
    })
    @ResponseMessage('Images synchronized successfully')
    async syncFeedbackImages(@Param('id', ParseUUIDPipe) id: string) {
        await this.feedbackImageService.syncFeedbackImages(id);
        return { message: 'Images synchronized successfully' };
    }
}