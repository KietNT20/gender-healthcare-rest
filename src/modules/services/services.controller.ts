import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @Post()
    create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }

    @Get()
    findAll() {
        return this.servicesService.findAll();
    }

    @Get(':id')
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    update(
        @Param('id') id: string,
        @Body() updateServiceDto: UpdateServiceDto,
    ) {
        return this.servicesService.update(id, updateServiceDto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    remove(@Param('id') id: string) {
        return this.servicesService.remove(id);
    }
}
