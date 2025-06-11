import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { CycleSymptomsService } from './cycle-symptoms.service';
import { CreateCycleSymptomDto } from './dto/create-cycle-symptom.dto';
import { UpdateCycleSymptomDto } from './dto/update-cycle-symptom.dto';

@Controller('cycle-symptoms')
export class CycleSymptomsController {
    constructor(private readonly cycleSymptomsService: CycleSymptomsService) {}

    @Post()
    create(@Body() createCycleSymptomDto: CreateCycleSymptomDto) {
        return this.cycleSymptomsService.create(createCycleSymptomDto);
    }

    @Get()
    findAll() {
        return this.cycleSymptomsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.cycleSymptomsService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCycleSymptomDto: UpdateCycleSymptomDto,
    ) {
        return this.cycleSymptomsService.update(+id, updateCycleSymptomDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.cycleSymptomsService.remove(+id);
    }
}
