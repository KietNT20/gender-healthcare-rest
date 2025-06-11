import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ConsultantProfilesService } from './consultant-profiles.service';
import { CreateConsultantProfileDto } from './dto/create-consultant-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';

@Controller('consultant-profiles')
export class ConsultantProfilesController {
    constructor(
        private readonly consultantProfilesService: ConsultantProfilesService,
    ) {}

    @Post()
    create(@Body() createConsultantProfileDto: CreateConsultantProfileDto) {
        return this.consultantProfilesService.create(
            createConsultantProfileDto,
        );
    }

    @Get()
    findAll() {
        return this.consultantProfilesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.consultantProfilesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateConsultantProfileDto: UpdateConsultantProfileDto,
    ) {
        return this.consultantProfilesService.update(
            +id,
            updateConsultantProfileDto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.consultantProfilesService.remove(+id);
    }
}
