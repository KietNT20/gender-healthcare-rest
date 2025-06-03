import { PartialType } from '@nestjs/mapped-types';
import { CreatePackageServiceUsageDto } from './create-package-service-usage.dto';

export class UpdatePackageServiceUsageDto extends PartialType(CreatePackageServiceUsageDto) {}
