import { PartialType } from '@nestjs/mapped-types';
import { CreateContractFileDto } from './create-contract-file.dto';

export class UpdateContractFileDto extends PartialType(CreateContractFileDto) {}
