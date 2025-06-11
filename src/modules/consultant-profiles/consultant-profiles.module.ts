import { Module } from '@nestjs/common';
import { ConsultantProfilesService } from './consultant-profiles.service';
import { ConsultantProfilesController } from './consultant-profiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantProfile } from './entities/consultant-profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ConsultantProfile])],
    controllers: [ConsultantProfilesController],
    providers: [ConsultantProfilesService],
})
export class ConsultantProfilesModule {}
