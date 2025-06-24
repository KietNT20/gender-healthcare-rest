import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContractFileDto {
    @IsUUID()
    contractId: string;

    @IsUUID('4')
    fileId: string;

    @IsOptional()
    @IsString()
    fileType?: string;
}
