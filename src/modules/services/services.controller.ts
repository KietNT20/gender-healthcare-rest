import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceProfileDto, ServiceResponseDto } from './dto/service-response.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một dịch vụ' })
  @ApiResponse({ status: 201, description: 'Dịch vụ được tạo thành công', type: ServiceResponseDto })
  @ResponseMessage('Dịch vụ được tạo thành công')
  create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ với phân trang, lọc và sắp xếp' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang, mặc định là 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang, mặc định là 10' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Trường sắp xếp (name, price, duration, createdAt, updatedAt), mặc định là createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Thứ tự sắp xếp, mặc định là DESC' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Từ khóa tìm kiếm trong tên hoặc mô tả' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'ID danh mục' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Giá tối thiểu' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Giá tối đa' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Trạng thái hoạt động' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Dịch vụ nổi bật' })
  @ApiResponse({ status: 200, description: 'Danh sách dịch vụ được lấy thành công' })
  @ResponseMessage('Danh sách dịch vụ được lấy thành công')
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: false, forbidNonWhitelisted: false }))
    serviceQueryDto: ServiceQueryDto,
  ) {
    return this.servicesService.findAll(serviceQueryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một dịch vụ theo ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
  @ApiResponse({ status: 200, description: 'Dịch vụ được lấy thành công', type: ServiceResponseDto })
  @ResponseMessage('Dịch vụ được lấy thành công')
  findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin dịch vụ' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
  @ApiResponse({ status: 200, description: 'Dịch vụ được cập nhật thành công', type: ServiceResponseDto })
  @ResponseMessage('Dịch vụ được cập nhật thành công')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceProfileDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm một dịch vụ' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
  @ApiResponse({ status: 200, description: 'Dịch vụ được xóa thành công' })
  @ResponseMessage('Dịch vụ được xóa thành công')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.servicesService.remove(id);
    return { message: 'Dịch vụ được xóa thành công' };
  }
}