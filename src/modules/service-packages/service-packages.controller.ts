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
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly packagesService: ServicePackagesService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  async create(@Body() createDto: CreateServicePackageDto) {
    return this.packagesService.create(createDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  findAll() {
    return this.packagesService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  async update(@Param('id') id: string, @Body() updateDto: UpdateServicePackageDto) {
    return this.packagesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  async remove(@Param('id') id: string) {
    await this.packagesService.remove(id);
    return { message: 'Package deleted successfully' };
  }
}