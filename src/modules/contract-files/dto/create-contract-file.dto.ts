import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContractFileDto {
    @IsUUID()
    contractId: string;

    @IsUUID()
    fileId: string;

    @IsOptional()
    @IsString()
    fileType?: string;
}
