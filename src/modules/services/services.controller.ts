import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceProfileDto } from './dto/service-response.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { RolesNameEnum } from 'src/enums';

@ApiBearerAuth()
@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(RoleGuard,JwtAuthGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully', type: ServiceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiBody({ type: CreateServiceDto })
  @ResponseMessage('Service created successfully')
  async create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of services with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @ResponseMessage('Services retrieved successfully')
  async findAll(@Query() query: ServiceQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a service by slug' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully', type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiParam({ name: 'slug', description: 'Service slug', type: String })
  @ResponseMessage('Service retrieved successfully')
  async findBySlug(@Param('slug') slug: string): Promise<ServiceResponseDto> {
    return this.servicesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully', type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ResponseMessage('Service retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard,JwtAuthGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Update a service by ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully', type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ApiBody({ type: UpdateServiceProfileDto })
  @ResponseMessage('Service updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceProfileDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard,JwtAuthGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Soft delete a service by ID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can perform this action' })
  @ResponseMessage('Service deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.servicesService.remove(id);
    return { message: 'Service deleted successfully' };
  }
}