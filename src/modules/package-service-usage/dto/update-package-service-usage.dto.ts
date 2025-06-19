import { PartialType } from '@nestjs/swagger';
import { CreatePackageServiceUsageDto } from './create-package-service-usage.dto';

export class UpdatePackageServiceUsageDto extends PartialType(
  CreatePackageServiceUsageDto,
) {}