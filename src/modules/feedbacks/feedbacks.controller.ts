import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  /**
   * Create a new feedback
   * @param createDto Data to create a feedback
   * @param file Optional file upload for feedback
   * @returns Created feedback
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Create a new feedback' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully', type: CreateFeedbackDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Customer, Staff, Manager, or Admin can perform this action' })
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
  @ApiOperation({ summary: 'Get a list of feedbacks with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  @ResponseMessage('Feedbacks retrieved successfully')
  async findAll(@Query() queryDto: FeedbackQueryDto) {
    return this.feedbacksService.findAll(queryDto);
  }

  /**
   * Get a feedback by ID
   * @param id Feedback ID
   * @returns Feedback details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved successfully', type: CreateFeedbackDto })
  @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
  @ResponseMessage('Feedback retrieved successfully')
  async findOne(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid feedback ID'),
    })) id: string,
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
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Update a feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully', type: UpdateFeedbackDto })
  @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Manager or Admin can perform this action' })
  @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
  @ApiBody({ type: UpdateFeedbackDto })
  @ResponseMessage('Feedback updated successfully')
  async update(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid feedback ID'),
    })) id: string,
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
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Soft delete a feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid feedback ID format' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin can perform this action' })
  @ApiParam({ name: 'id', description: 'Feedback ID', type: String })
  @ResponseMessage('Feedback deleted successfully')
  async remove(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid feedback ID'),
    })) id: string,
  ) {
    await this.feedbacksService.remove(id);
    return { message: 'Feedback deleted successfully' };
  }
}