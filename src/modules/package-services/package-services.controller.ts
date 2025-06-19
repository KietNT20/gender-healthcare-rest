import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PackageServicesService } from './package-services.service';
import { CreatePackageServiceDto } from './dto/create-package-service.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('package-services')
export class PackageServicesController {
  constructor(private readonly packageServicesService: PackageServicesService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  async create(@Body() createDto: CreatePackageServiceDto) {
    return this.packageServicesService.create(createDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  findAll() {
    return this.packageServicesService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async findOne(@Param('id') id: string) {
    return this.packageServicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  async update(@Param('id') id: string, @Body() updateDto: UpdatePackageServiceDto) {
    return this.packageServicesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  async remove(@Param('id') id: string) {
    await this.packageServicesService.remove(id);
    return { message: 'Package service deleted successfully' };
  }
}