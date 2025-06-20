import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { ConsultantAvailabilityCrudService } from './consultant-availability-crud.service';
import { ConsultantAvailabilityController } from './consultant-availability.controller';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { ConsultantAvailability } from './entities/consultant-availability.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ConsultantAvailability, ConsultantProfile]),
    ],
    controllers: [ConsultantAvailabilityController],
    providers: [
        ConsultantAvailabilityService,
        ConsultantAvailabilityCrudService,
    ],
    exports: [ConsultantAvailabilityService],
})
export class ConsultantAvailabilityModule {}
