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
  import { PackageServiceUsageService } from './package-service-usage.service';
  import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
  import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RoleGuard } from '../../guards/role.guard';
  import { Roles } from '../../decorators/roles.decorator';
  import { RolesNameEnum } from '../../enums';
  import { ApiBearerAuth } from '@nestjs/swagger';
  
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller('package-service-usage')
  export class PackageServiceUsageController {
    constructor(
      private readonly packageServiceUsageService: PackageServiceUsageService,
    ) {}
  
    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    async create(@Body() createDto: CreatePackageServiceUsageDto) {
      return this.packageServiceUsageService.create(createDto);
    }
  
    @Get()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    findAll() {
      return this.packageServiceUsageService.findAll();
    }
  
    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    async findOne(@Param('id') id: string) {
      return this.packageServiceUsageService.findOne(id);
    }
  
    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    async update(
      @Param('id') id: string,
      @Body() updateDto: UpdatePackageServiceUsageDto,
    ) {
      return this.packageServiceUsageService.update(id, updateDto);
    }
  
    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    async remove(@Param('id') id: string) {
      return this.packageServiceUsageService.remove(id);
    }
  }