import { PartialType } from '@nestjs/mapped-types';
import { CreatePackageServiceDto } from './create-package-service.dto';

export class UpdatePackageServiceDto extends PartialType(CreatePackageServiceDto) {}
