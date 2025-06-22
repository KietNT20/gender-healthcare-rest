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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { ServicePackageQueryDto } from './dto/service-package-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ResponseMessage } from 'src/decorators/response-message.decorator';


@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly packagesService: ServicePackagesService) {}

  /**
   * Create a new service package
   * @param createDto Data to create a service package
   * @returns Created service package
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Create a new service package' })
  @ApiResponse({ status: 201, description: 'Service package created successfully', type: CreateServicePackageDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiBody({ type: CreateServicePackageDto })
  @ResponseMessage('Service package created successfully')
  async create(@Body() createDto: CreateServicePackageDto) {
    return this.packagesService.create(createDto);
  }

  /**
   * Get a list of service packages with pagination and filters
   * @param queryDto Query parameters for pagination and filtering
   * @returns List of service packages with pagination metadata
   */
  @Get()

  @ApiOperation({ summary: 'Get a list of service packages with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Service packages retrieved successfully' })
  @ResponseMessage('Service packages retrieved successfully')
  async findAll(@Query() queryDto: ServicePackageQueryDto) {
    return this.packagesService.findAll(queryDto);
  }

  /**
   * Get a service package by ID
   * @param id Service package ID
   * @returns Service package details
   */
  @Get(':id')

  @ApiOperation({ summary: 'Get a service package by ID' })
  @ApiResponse({ status: 200, description: 'Service package retrieved successfully', type: CreateServicePackageDto })
  @ApiResponse({ status: 400, description: 'Invalid service package ID format' })
  @ApiResponse({ status: 404, description: 'Service package not found' })
  @ApiParam({ name: 'id', description: 'Service package ID', type: String })
  @ResponseMessage('Service package retrieved successfully')
  async findOne(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid service package ID'),
    })) id: string,
  ) {
    return this.packagesService.findOne(id);
  }

  /**
   * Update a service package by ID
   * @param id Service package ID
   * @param updateDto Data to update the service package
   * @returns Updated service package
   */
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Update a service package by ID' })
  @ApiResponse({ status: 200, description: 'Service package updated successfully', type: UpdateServicePackageDto })
  @ApiResponse({ status: 400, description: 'Invalid service package ID format' })
  @ApiResponse({ status: 404, description: 'Service package not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiParam({ name: 'id', description: 'Service package ID', type: String })
  @ApiBody({ type: UpdateServicePackageDto })
  @ResponseMessage('Service package updated successfully')
  async update(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid service package ID'),
    })) id: string,
    @Body() updateDto: UpdateServicePackageDto,
  ) {
    return this.packagesService.update(id, updateDto);
  }

  /**
   * Soft delete a service package by ID
   * @param id Service package ID
   * @returns Success message
   */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Soft delete a service package by ID' })
  @ApiResponse({ status: 200, description: 'Service package deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid service package ID format' })
  @ApiResponse({ status: 404, description: 'Service package not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin can perform this action' })
  @ApiParam({ name: 'id', description: 'Service package ID', type: String })
  @ResponseMessage('Service package deleted successfully')
  async remove(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid service package ID'),
    })) id: string,
  ) {
    await this.packagesService.remove(id);
    return { message: 'Service package deleted successfully' };
  }
}