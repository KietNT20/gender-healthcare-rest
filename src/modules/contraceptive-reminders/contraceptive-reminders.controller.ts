import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';
import { CreateContraceptiveReminderDto } from './dto/create-contraceptive-reminder.dto';
import { UpdateContraceptiveReminderDto } from './dto/update-contraceptive-reminder.dto';

@ApiTags('Contraceptive Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contraceptive-reminders')
export class ContraceptiveRemindersController {
    constructor(
        private readonly contraceptiveRemindersService: ContraceptiveRemindersService,
    ) {}

    @Post()
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Create a new contraceptive reminder' })
    create(
        @CurrentUser() user: User,
        @Body() createDto: CreateContraceptiveReminderDto,
    ) {
        return this.contraceptiveRemindersService.create(user.id, createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all contraceptive reminders for the current user',
    })
    findAll(@CurrentUser() user: User) {
        return this.contraceptiveRemindersService.findAll(user.id);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get details of a specific contraceptive reminder',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.contraceptiveRemindersService.findOne(id, user.id);
    }

    @Put(':id')
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Update a contraceptive reminder' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Body() updateDto: UpdateContraceptiveReminderDto,
    ) {
        return this.contraceptiveRemindersService.update(
            id,
            user.id,
            updateDto,
        );
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a contraceptive reminder ( Soft delete )',
    })
    @ResponseMessage('Delete contraceptive reminder successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.contraceptiveRemindersService.remove(id, user.id);
    }
}
