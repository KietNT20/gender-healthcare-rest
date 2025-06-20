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
    UseInterceptors,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { QueryConsultantAvailabilityDto } from './dto/query-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('consultant-availability')
export class ConsultantAvailabilityController {
    constructor(
        private readonly availabilityService: ConsultantAvailabilityService,
    ) {}

    @Post()
    @Roles([RolesNameEnum.CONSULTANT])
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Consultant create availability' })
    @ApiResponse({
        status: 201,
        description: 'Create availability successfully.',
    })
    create(
        @CurrentUser() currentUser: User,
        @Body() createDto: CreateConsultantAvailabilityDto,
    ) {
        return this.availabilityService.create(currentUser, createDto);
    }

    @Get()
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({ summary: 'Consultant get all availability' })
    @ApiResponse({
        status: 200,
        description: 'Get all availability successfully.',
    })
    findAll(
        @CurrentUser() currentUser: User,
        @Query() queryDto: QueryConsultantAvailabilityDto,
    ) {
        return this.availabilityService.findAll(currentUser, queryDto);
    }

    @Get(':id')
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({ summary: 'Consultant get availability by id' })
    @ApiResponse({ status: 200, description: 'Get availability successfully.' })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.availabilityService.findOne(id, currentUser);
    }

    @Put(':id')
    @Roles([RolesNameEnum.CONSULTANT])
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Consultant update availability' })
    @ApiResponse({
        status: 200,
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
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiOperation({ summary: 'Consultant delete availability' })
    @ApiResponse({
        status: 200,
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
