import {
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
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { HealthDataConsentGuard } from 'src/guards/health-data-consent.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';
import {
    CreateMenstrualCycleResponse,
    MenstrualCyclesService,
} from './menstrual-cycles.service';

@ApiTags('Menstrual Cycles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HealthDataConsentGuard)
@Controller('menstrual-cycles')
export class MenstrualCyclesController {
    constructor(
        private readonly menstrualCyclesService: MenstrualCyclesService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new menstrual cycle' })
    @ApiResponse({
        status: 201,
        description: 'Chu kỳ kinh nguyệt đã được tạo thành công',
        type: MenstrualCycle,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu không hợp lệ',
    })
    create(
        @CurrentUser() user: User,
        @Body() createMenstrualCycleDto: CreateMenstrualCycleDto,
    ): Promise<CreateMenstrualCycleResponse> {
        return this.menstrualCyclesService.create(
            user.id,
            createMenstrualCycleDto,
        );
    }

    @Get()
    @ApiOperation({
        summary: 'Get the history of menstrual cycles for a user',
    })
    findAll(@CurrentUser() user: User) {
        return this.menstrualCyclesService.findAll(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get detailed information about a cycle' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.menstrualCyclesService.findOne(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a menstrual cycle' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Body() updateMenstrualCycleDto: UpdateMenstrualCycleDto,
    ) {
        return this.menstrualCyclesService.update(
            id,
            user.id,
            updateMenstrualCycleDto,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a menstrual cycle' })
    remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.menstrualCyclesService.remove(id, user.id);
    }
}
