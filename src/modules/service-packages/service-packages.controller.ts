import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly servicePackagesService: ServicePackagesService) {}

  @Post()
  create(@Body() createServicePackageDto: CreateServicePackageDto) {
    return this.servicePackagesService.create(createServicePackageDto);
  }

  @Get()
  findAll() {
    return this.servicePackagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicePackagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServicePackageDto: UpdateServicePackageDto) {
    return this.servicePackagesService.update(+id, updateServicePackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicePackagesService.remove(+id);
  }
}
