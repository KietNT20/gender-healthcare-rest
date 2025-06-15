import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { SortServiceDto } from './dto/sort-service.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @Post()
    @ApiOperation({ summary: 'Tạo mới một dịch vụ' })
    create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách dịch vụ với phân trang, lọc và sắp xếp' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang, mặc định là 1' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số bản ghi mỗi trang, mặc định là 10' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Trường sắp xếp (name, price, duration, createdAt, updatedAt)' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Thứ tự sắp xếp, mặc định là DESC' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Từ khóa tìm kiếm trong tên hoặc mô tả' })
    @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'ID danh mục' })
    @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Giá tối thiểu' })
    @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Giá tối đa' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Trạng thái hoạt động' })
    @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Dịch vụ nổi bật' })
    findAll(
        @Query() pagination: PaginationDto,
        @Query() filter: FilterServiceDto,
        @Query() sort: SortServiceDto,
    ) {
        return this.servicesService.findAll(pagination, filter, sort);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin một dịch vụ theo ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin dịch vụ' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
    update(
        @Param('id') id: string,
        @Body() updateServiceDto: UpdateServiceDto,
    ) {
        return this.servicesService.update(id, updateServiceDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa mềm một dịch vụ' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID của dịch vụ' })
    remove(@Param('id') id: string) {
        return this.servicesService.remove(id);
    }
}