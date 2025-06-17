import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { SymptomQueryDto } from './dto/symptom-query.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { SymptomsService } from './symptoms.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('symptoms')
export class SymptomsController {
    constructor(private readonly symptomsService: SymptomsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new symptom' })
    @ApiResponse({
        status: 201,
        description: 'Symptom created successfully',
    })
    create(@Body() createSymptomDto: CreateSymptomDto) {
        return this.symptomsService.create(createSymptomDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all symptoms with pagination and filters' })
    findAll(@Query() symptomQueryDto: SymptomQueryDto) {
        return this.symptomsService.findAll(symptomQueryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a symptom by ID' })
    findOne(@Param('id') id: string) {
        return this.symptomsService.findOne(id);
    }

    @Patch(':id')
    @ApiResponse({
        status: 200,
        description: 'Symptom updated successfully',
    })
    @ApiOperation({ summary: 'Update a symptom by ID' })
    update(
        @Param('id') id: string,
        @Body() updateSymptomDto: UpdateSymptomDto,
    ) {
        return this.symptomsService.update(id, updateSymptomDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a symptom by ID' })
    @ResponseMessage('Symptom deleted successfully')
    remove(@Param('id') id: string) {
        return this.symptomsService.remove(id);
    }
}
