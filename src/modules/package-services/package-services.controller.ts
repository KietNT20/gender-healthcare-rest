import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
import { PackageServicesService } from './package-services.service';
import { CreatePackageServiceDto } from './dto/create-package-service.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@Controller('package-services')
export class PackageServicesController {
  constructor(private readonly packageServicesService: PackageServicesService) {}

  /**
   * Create a new package service
   * @param createDto Data to create a package service
   * @returns Created package service
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Create a new package service' })
  @ApiResponse({ status: 201, description: 'Package service created successfully', type: CreatePackageServiceDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiBody({ type: CreatePackageServiceDto })
  @ResponseMessage('Package service created successfully')
  async create(@Body() createDto: CreatePackageServiceDto) {
    return this.packageServicesService.create(createDto);
  }

  /**
   * Get a list of all package services
   * @returns List of package services
   */
  @Get()
  @ApiOperation({ summary: 'Get a list of all package services' })
  @ApiResponse({ status: 200, description: 'Package services retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Staff, Manager, or Admin can perform this action' })
  @ResponseMessage('Package services retrieved successfully')
  async findAll() {
    return this.packageServicesService.findAll();
  }

  /**
   * Get a package service by ID
   * @param id Package service ID
   * @returns Package service details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a package service by ID' })
  @ApiResponse({ status: 200, description: 'Package service retrieved successfully', type: CreatePackageServiceDto })
  @ApiResponse({ status: 400, description: 'Invalid package service ID format' })
  @ApiResponse({ status: 404, description: 'Package service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Staff, Manager, or Admin can perform this action' })
  @ApiParam({ name: 'id', description: 'Package service ID', type: String })
  @ResponseMessage('Package service retrieved successfully')
  async findOne(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid package service ID'),
    })) id: string,
  ) {
    return this.packageServicesService.findOne(id);
  }

  /**
   * Update a package service by ID
   * @param id Package service ID
   * @param updateDto Data to update the package service
   * @returns Updated package service
   */
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Update a package service by ID' })
  @ApiResponse({ status: 200, description: 'Package service updated successfully', type: UpdatePackageServiceDto })
  @ApiResponse({ status: 400, description: 'Invalid package service ID format' })
  @ApiResponse({ status: 404, description: 'Package service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiParam({ name: 'id', description: 'Package service ID', type: String })
  @ApiBody({ type: UpdatePackageServiceDto })
  @ResponseMessage('Package service updated successfully')
  async update(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid package service ID'),
    })) id: string,
    @Body() updateDto: UpdatePackageServiceDto,
  ) {
    return this.packageServicesService.update(id, updateDto);
  }

  /**
   * Soft delete a package service by ID
   * @param id Package service ID
   * @returns Success message
   */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Soft delete a package service by ID' })
  @ApiResponse({ status: 200, description: 'Package service deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid package service ID format' })
  @ApiResponse({ status: 404, description: 'Package service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin can perform this action' })
  @ApiParam({ name: 'id', description: 'Package service ID', type: String })
  @ResponseMessage('Package service deleted successfully')
  async remove(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid package service ID'),
    })) id: string,
  ) {
    await this.packageServicesService.remove(id);
    return { message: 'Package service deleted successfully' };
  }
}