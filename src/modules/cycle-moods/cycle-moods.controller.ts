import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CycleMoodsService } from './cycle-moods.service';
import { CreateCycleMoodDto } from './dto/create-cycle-mood.dto';
import { CycleMoodQueryDto } from './dto/cycle-mood-query.dto';
import { UpdateCycleMoodDto } from './dto/update-cycle-mood.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cycle-moods')
export class CycleMoodsController {
    constructor(private readonly cycleMoodsService: CycleMoodsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new cycle mood entry' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Cycle mood entry created successfully.',
    })
    create(@Body() createCycleMoodDto: CreateCycleMoodDto) {
        return this.cycleMoodsService.create(createCycleMoodDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all cycle moods with optional filtering',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of cycle moods retrieved successfully.',
    })
    findAll(@Query() cycleMoodQueryDto: CycleMoodQueryDto) {
        return this.cycleMoodsService.findAll(cycleMoodQueryDto);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get details of a specific cycle mood entry',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleMoodsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a specific cycle mood entry',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCycleMoodDto: UpdateCycleMoodDto,
    ) {
        return this.cycleMoodsService.update(id, updateCycleMoodDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a specific cycle mood entry ( Soft delete )',
    })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleMoodsService.remove(id);
    }
}
