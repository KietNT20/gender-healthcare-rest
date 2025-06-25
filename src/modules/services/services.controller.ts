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
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceImageDto } from './dto/create-service-image.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceImageService } from './service-image.service';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
    constructor(
        private readonly servicesService: ServicesService,
        private readonly serviceImageService: ServiceImageService,
    ) {}

    /**
     * Create a new service
     * @param createServiceDto Data to create a service
     * @returns Created service
     */
    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new service' })
    @ApiResponse({
        status: 201,
        description: 'Service created successfully',
        type: ServiceResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can perform this action',
    })
    @ApiBody({ type: CreateServiceDto })
    @ResponseMessage('Service created successfully')
    async create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }

    /**
     * Get a list of services with pagination and filters
     * @param query Query parameters for pagination and filtering
     * @returns List of services with pagination metadata
     */
    @Get()
    @ApiOperation({
        summary: 'Get a list of services with pagination and filters',
    })
    @ApiResponse({
        status: 200,
        description: 'Services retrieved successfully',
        type: [ServiceResponseDto],
    })
    @ResponseMessage('Services retrieved successfully')
    async findAll(@Query() query: ServiceQueryDto) {
        return this.servicesService.findAll(query);
    }

    /**
     * Get a service by slug
     * @param slug Service slug
     * @returns Service details
     */
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get a service by slug' })
    @ApiResponse({
        status: 200,
        description: 'Service retrieved successfully',
        type: ServiceResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Service not found' })
    @ApiParam({ name: 'slug', description: 'Service slug', type: String })
    @ResponseMessage('Service retrieved successfully')
    async findBySlug(@Param('slug') slug: string) {
        return this.servicesService.findBySlug(slug);
    }

    /**
     * Get a service by ID
     * @param id Service ID
     * @returns Service details
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get a service by ID' })
    @ApiResponse({
        status: 200,
        description: 'Service retrieved successfully',
        type: ServiceResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid service ID format' })
    @ApiResponse({ status: 404, description: 'Service not found' })
    @ResponseMessage('Service retrieved successfully')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.servicesService.findOne(id);
    }

    /**
     * Update a service by ID
     * @param id Service ID
     * @param updateServiceDto Data to update the service
     * @returns Updated service
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a service by ID' })
    @ApiResponse({
        status: 200,
        description: 'Service updated successfully',
        type: ServiceResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid service ID format' })
    @ApiResponse({ status: 404, description: 'Service not found' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can perform this action',
    })
    @ApiBody({ type: UpdateServiceDto })
    @ResponseMessage('Service updated successfully')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateServiceDto: UpdateServiceDto,
    ) {
        return this.servicesService.update(id, updateServiceDto);
    }

    /**
     * Soft delete a service by ID
     * @param id Service ID
     * @returns Success message
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete a service by ID' })
    @ApiResponse({ status: 200, description: 'Service deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid service ID format' })
    @ApiResponse({ status: 404, description: 'Service not found' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can perform this action',
    })
    @ResponseMessage('Service deleted successfully')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        await this.servicesService.remove(id);
        return { message: 'Service deleted successfully' };
    }

    /**
     * Synchronize images with a service
     * @param id Service ID
     */
    @Patch('image/:id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Synchronize images with a service' })
    @ApiResponse({
        status: 200,
        description: 'Images synchronized successfully',
    })
    @ApiResponse({ status: 400, description: 'Invalid service ID format' })
    @ApiResponse({ status: 404, description: 'Service not found' })
    @ResponseMessage('Images synchronized successfully')
    async syncServiceImages(@Param('id', ParseUUIDPipe) id: string) {
        await this.serviceImageService.syncServiceImages(id);
        return { message: 'Images synchronized successfully' };
    }

    /**
     * Add an image to a service
     * @param createServiceImageDto DTO containing serviceId and imageId
     */
    @Post('image')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add an image to a service' })
    @ApiResponse({ status: 201, description: 'Image added successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({ status: 404, description: 'Service or image not found' })
    @ApiBody({ type: CreateServiceImageDto })
    @ResponseMessage('Image added successfully')
    async addImageToService(
        @Body() createServiceImageDto: CreateServiceImageDto,
    ) {
        await this.serviceImageService.addImageToService(createServiceImageDto);
        return { message: 'Image added successfully' };
    }

    /**
     * Remove an image from a service
     * @param createServiceImageDto DTO containing serviceId and imageId
     */
    @Put('image')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove an image from a service' })
    @ApiResponse({ status: 200, description: 'Image removed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({ status: 404, description: 'Service or image not found' })
    @ApiBody({ type: CreateServiceImageDto })
    @ResponseMessage('Image removed successfully')
    async removeImageFromService(
        @Body() createServiceImageDto: CreateServiceImageDto,
    ) {
        await this.serviceImageService.removeImageFromService(
            createServiceImageDto,
        );
        return { message: 'Image removed successfully' };
    }
}
