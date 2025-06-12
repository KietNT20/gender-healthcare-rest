import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';

@Controller('consultant-availability')
export class ConsultantAvailabilityController {
    constructor(
        private readonly consultantAvailabilityService: ConsultantAvailabilityService,
    ) {}

    @Post()
    create(
        @Body()
        createConsultantAvailabilityDto: CreateConsultantAvailabilityDto,
    ) {
        return this.consultantAvailabilityService.create(
            createConsultantAvailabilityDto,
        );
    }

    @Get()
    findAll() {
        return this.consultantAvailabilityService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.consultantAvailabilityService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body()
        updateConsultantAvailabilityDto: UpdateConsultantAvailabilityDto,
    ) {
        return this.consultantAvailabilityService.update(
            +id,
            updateConsultantAvailabilityDto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.consultantAvailabilityService.remove(+id);
    }
}
