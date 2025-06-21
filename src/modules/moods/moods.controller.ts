import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMoodDto } from './dto/create-mood.dto';
import { MoodQueryDto } from './dto/query-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { MoodsService } from './moods.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moods')
export class MoodsController {
    constructor(private readonly moodsService: MoodsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new mood' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Mood created successfully',
    })
    create(@Body() createMoodDto: CreateMoodDto) {
        return this.moodsService.create(createMoodDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all moods with pagination and filters' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Moods retrieved successfully',
    })
    findAll(@Query() moodQueryDto: MoodQueryDto) {
        return this.moodsService.findAll(moodQueryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a mood by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Mood retrieved successfully',
    })
    findOne(@Param('id') id: string) {
        return this.moodsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a mood by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Mood updated successfully',
    })
    update(@Param('id') id: string, @Body() updateMoodDto: UpdateMoodDto) {
        return this.moodsService.update(id, updateMoodDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a mood by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Mood deleted successfully',
    })
    @ResponseMessage('Mood deleted successfully')
    remove(@Param('id') id: string) {
        return this.moodsService.remove(id);
    }
}
