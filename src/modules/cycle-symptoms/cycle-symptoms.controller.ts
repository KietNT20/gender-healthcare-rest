import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CycleSymptomsService } from './cycle-symptoms.service';
import { CreateCycleSymptomDto } from './dto/create-cycle-symptom.dto';
import { CycleSymptomQueryDto } from './dto/cycle-symptom-query.dto';
import { UpdateCycleSymptomDto } from './dto/update-cycle-symptom.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cycle-symptoms')
export class CycleSymptomsController {
    constructor(private readonly cycleSymptomsService: CycleSymptomsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new cycle symptom entry' })
    create(@Body() createCycleSymptomDto: CreateCycleSymptomDto) {
        return this.cycleSymptomsService.create(createCycleSymptomDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all cycle symptoms with optional filtering',
    })
    findAll(@Query() cycleSymptomQueryDto: CycleSymptomQueryDto) {
        return this.cycleSymptomsService.findAll(cycleSymptomQueryDto);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get details of a specific cycle symptom entry',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleSymptomsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a specific cycle symptom entry',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCycleSymptomDto: UpdateCycleSymptomDto,
    ) {
        return this.cycleSymptomsService.update(id, updateCycleSymptomDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a specific cycle symptom entry ( Soft delete )',
    })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleSymptomsService.remove(id);
    }
}
