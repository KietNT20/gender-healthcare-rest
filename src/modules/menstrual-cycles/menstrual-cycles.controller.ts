import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { MenstrualCyclesService } from './menstrual-cycles.service';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';

@Controller('menstrual-cycles')
export class MenstrualCyclesController {
    constructor(
        private readonly menstrualCyclesService: MenstrualCyclesService,
    ) {}

    @Post()
    create(@Body() createMenstrualCycleDto: CreateMenstrualCycleDto) {
        return this.menstrualCyclesService.create(createMenstrualCycleDto);
    }

    @Get()
    findAll() {
        return this.menstrualCyclesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.menstrualCyclesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateMenstrualCycleDto: UpdateMenstrualCycleDto,
    ) {
        return this.menstrualCyclesService.update(+id, updateMenstrualCycleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.menstrualCyclesService.remove(+id);
    }
}
