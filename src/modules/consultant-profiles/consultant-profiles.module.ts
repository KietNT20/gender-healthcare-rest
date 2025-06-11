import { Module } from '@nestjs/common';
import { ConsultantProfilesService } from './consultant-profiles.service';
import { ConsultantProfilesController } from './consultant-profiles.controller';

@Module({
  controllers: [ConsultantProfilesController],
  providers: [ConsultantProfilesService],
})
export class ConsultantProfilesModule {}
