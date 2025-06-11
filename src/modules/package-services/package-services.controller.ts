import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { PackageServicesService } from './package-services.service';
import { CreatePackageServiceDto } from './dto/create-package-service.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';

@Controller('package-services')
export class PackageServicesController {
    constructor(
        private readonly packageServicesService: PackageServicesService,
    ) {}

    @Post()
    create(@Body() createPackageServiceDto: CreatePackageServiceDto) {
        return this.packageServicesService.create(createPackageServiceDto);
    }

    @Get()
    findAll() {
        return this.packageServicesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packageServicesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updatePackageServiceDto: UpdatePackageServiceDto,
    ) {
        return this.packageServicesService.update(+id, updatePackageServiceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.packageServicesService.remove(+id);
    }
}
