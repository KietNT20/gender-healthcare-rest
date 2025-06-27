import { Module } from '@nestjs/common';
import { ServicePackagesStatsController } from './service-packages-stats.controller';
import { ServicePackagesStatsService } from './service-packages-stats.service';

@Module({
  controllers: [ServicePackagesStatsController],
  providers: [ServicePackagesStatsService]
})
export class ServicePackagesStatsModule {}
