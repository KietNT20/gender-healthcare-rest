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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';
import { MenstrualCyclesService } from './menstrual-cycles.service';

@ApiTags('Menstrual Cycles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menstrual-cycles')
export class MenstrualCyclesController {
    constructor(
        private readonly menstrualCyclesService: MenstrualCyclesService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new menstrual cycle' })
    create(
        @CurrentUser() user: User,
        @Body() createMenstrualCycleDto: CreateMenstrualCycleDto,
    ) {
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
