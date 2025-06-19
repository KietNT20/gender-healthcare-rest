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
import { ApiBearerAuth } from '@nestjs/swagger';
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
    create(@Body() createCycleSymptomDto: CreateCycleSymptomDto) {
        return this.cycleSymptomsService.create(createCycleSymptomDto);
    }

    @Get()
    findAll(@Query() cycleSymptomQueryDto: CycleSymptomQueryDto) {
        return this.cycleSymptomsService.findAll(cycleSymptomQueryDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleSymptomsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCycleSymptomDto: UpdateCycleSymptomDto,
    ) {
        return this.cycleSymptomsService.update(id, updateCycleSymptomDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleSymptomsService.remove(id);
    }
}
