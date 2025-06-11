import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PackageServiceUsageService } from './package-service-usage.service';
import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';

@Controller('package-service-usage')
export class PackageServiceUsageController {
  constructor(private readonly packageServiceUsageService: PackageServiceUsageService) {}

  @Post()
  create(@Body() createPackageServiceUsageDto: CreatePackageServiceUsageDto) {
    return this.packageServiceUsageService.create(createPackageServiceUsageDto);
  }

  @Get()
  findAll() {
    return this.packageServiceUsageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageServiceUsageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePackageServiceUsageDto: UpdatePackageServiceUsageDto) {
    return this.packageServiceUsageService.update(+id, updatePackageServiceUsageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packageServiceUsageService.remove(+id);
  }
}
