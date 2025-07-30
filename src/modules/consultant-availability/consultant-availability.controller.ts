import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConsultantAvailabilityCrudService } from './consultant-availability-crud.service';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { QueryConsultantAvailabilityDto } from './dto/query-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';

@ApiTags('Consultant Availability')
@Controller('consultant-availability')
export class ConsultantAvailabilityController {
    constructor(
        private readonly availabilityService: ConsultantAvailabilityService,
        private readonly consultantAvailabilityCrudService: ConsultantAvailabilityCrudService,
    ) {}

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiOperation({ summary: 'Consultant create availability' })
    @ApiCreatedResponse({
        description: 'Create availability successfully.',
    })
    @ApiBadRequestResponse({
        description: 'Bad Request: Invalid request body or validation failed',
    })
    @ApiUnauthorizedResponse({
        description:
            'Unauthorized: Only authenticated users can create availability',
    })
    @ApiForbiddenResponse({
        description: 'Forbidden: Just consultant can create availability',
    })
    create(
        @CurrentUser() currentUser: User,
        @Body() createDto: CreateConsultantAvailabilityDto,
    ) {
        return this.availabilityService.create(currentUser, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Consultant get all availability' })
    @ApiOkResponse({
        description: 'Get all availability successfully.',
    })
    findAll(@Query() queryDto: QueryConsultantAvailabilityDto) {
        return this.consultantAvailabilityCrudService.findAll(queryDto);
    }

    @Get('consultant')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({ summary: 'Consultant get all availability' })
    @ApiOkResponse({
        description: 'Get all availability successfully.',
    })
    findAllByConsultant(
        @CurrentUser() currentUser: User,
        @Query() queryDto: QueryConsultantAvailabilityDto,
    ) {
        return this.availabilityService.findAllConsultantAvailability(
            currentUser,
            queryDto,
        );
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({ summary: 'Consultant get availability by id' })
    @ApiOkResponse({
        description: 'Get availability successfully.',
    })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.availabilityService.findOne(id, currentUser);
    }

    @Put(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiOperation({ summary: 'Consultant update availability' })
    @ApiOkResponse({
        description: 'Update availability successfully.',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
        @Body() updateDto: UpdateConsultantAvailabilityDto,
    ) {
        return this.availabilityService.update(id, currentUser, updateDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiOperation({ summary: 'Consultant delete availability' })
    @ApiOkResponse({
        description: 'Delete availability successfully.',
    })
    @ResponseMessage('Availability deleted successfully.')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        await this.availabilityService.remove(id, currentUser);
    }
}