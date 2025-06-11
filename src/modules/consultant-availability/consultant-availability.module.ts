import { Module } from '@nestjs/common';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { ConsultantAvailabilityController } from './consultant-availability.controller';

@Module({
    controllers: [ConsultantAvailabilityController],
    providers: [ConsultantAvailabilityService],
})
export class ConsultantAvailabilityModule {}
