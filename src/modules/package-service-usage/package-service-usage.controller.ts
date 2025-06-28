import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../decorators/response-message.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesNameEnum } from '../../enums';
import { RoleGuard } from '../../guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';
import { PackageServiceUsageService } from './package-service-usage.service';

@ApiTags('Package Service Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('package-service-usage')
export class PackageServiceUsageController {
    constructor(
        private readonly packageServiceUsageService: PackageServiceUsageService,
    ) {}

    /**
     * Create a new package service usage record
     * @param createDto Data to create a package service usage
     * @returns Created package service usage
     */
    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Create a new package service usage record' })
    @ApiResponse({
        status: 201,
        description: 'Package service usage created successfully',
        type: CreatePackageServiceUsageDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can perform this action',
    })
    @ApiBody({ type: CreatePackageServiceUsageDto })
    @ResponseMessage('Package service usage created successfully')
    async create(@Body() createDto: CreatePackageServiceUsageDto) {
        return this.packageServiceUsageService.create(createDto);
    }

    /**
     * Get a list of all package service usage records
     * @returns List of package service usage records
     */
    @Get()
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({
        summary: 'Get a list of all package service usage records',
    })
    @ApiResponse({
        status: 200,
        description: 'Package service usage records retrieved successfully',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Staff, Manager, or Admin can perform this action',
    })
    @ResponseMessage('Package service usage records retrieved successfully')
    async findAll() {
        return this.packageServiceUsageService.findAll();
    }

    /**
     * Get a package service usage record by ID
     * @param id Package service usage ID
     * @returns Package service usage details
     */
    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({ summary: 'Get a package service usage record by ID' })
    @ApiResponse({
        status: 200,
        description: 'Package service usage retrieved successfully',
        type: CreatePackageServiceUsageDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid package service usage ID format',
    })
    @ApiResponse({
        status: 404,
        description: 'Package service usage not found',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Staff, Manager, or Admin can perform this action',
    })
    @ApiParam({
        name: 'id',
        description: 'Package service usage ID',
        type: String,
    })
    @ResponseMessage('Package service usage retrieved successfully')
    async findOne(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid package service usage ID'),
            }),
        )
        id: string,
    ) {
        return this.packageServiceUsageService.findOne(id);
    }

    /**
     * Update a package service usage record by ID
     * @param id Package service usage ID
     * @param updateDto Data to update the package service usage
     * @returns Updated package service usage
     */
    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Update a package service usage record by ID' })
    @ApiResponse({
        status: 200,
        description: 'Package service usage updated successfully',
        type: UpdatePackageServiceUsageDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid package service usage ID format',
    })
    @ApiResponse({
        status: 404,
        description: 'Package service usage not found',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can perform this action',
    })
    @ApiParam({
        name: 'id',
        description: 'Package service usage ID',
        type: String,
    })
    @ApiBody({ type: UpdatePackageServiceUsageDto })
    @ResponseMessage('Package service usage updated successfully')
    async update(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid package service usage ID'),
            }),
        )
        id: string,
        @Body() updateDto: UpdatePackageServiceUsageDto,
    ) {
        return this.packageServiceUsageService.update(id, updateDto);
    }

    /**
     * Soft delete a package service usage record by ID
     * @param id Package service usage ID
     * @returns Success message
     */
    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({
        summary: 'Soft delete a package service usage record by ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Package service usage deleted successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid package service usage ID format',
    })
    @ApiResponse({
        status: 404,
        description: 'Package service usage not found',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin can perform this action',
    })
    @ApiParam({
        name: 'id',
        description: 'Package service usage ID',
        type: String,
    })
    @ResponseMessage('Package service usage deleted successfully')
    async remove(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid package service usage ID'),
            }),
        )
        id: string,
    ) {
        await this.packageServiceUsageService.remove(id);
        return { message: 'Package service usage deleted successfully' };
    }
}
