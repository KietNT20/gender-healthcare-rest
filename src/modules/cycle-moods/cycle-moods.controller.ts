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
    create(@Body() createCycleMoodDto: CreateCycleMoodDto) {
        return this.cycleMoodsService.create(createCycleMoodDto);
    }

    @Get()
    findAll(@Query() cycleMoodQueryDto: CycleMoodQueryDto) {
        return this.cycleMoodsService.findAll(cycleMoodQueryDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleMoodsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCycleMoodDto: UpdateCycleMoodDto,
    ) {
        return this.cycleMoodsService.update(id, updateCycleMoodDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.cycleMoodsService.remove(id);
    }
}
