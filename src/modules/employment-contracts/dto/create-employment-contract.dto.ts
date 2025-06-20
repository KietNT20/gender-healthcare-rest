import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ContractStatusType } from 'src/enums';

export class CreateEmploymentContractDto {
    @ApiProperty({ description: 'ID of the user (employee)' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Contract number' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    contractNumber: string;

    @ApiProperty({
        description: 'Type of contract (e.g., "Full-time", "Part-time")',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    contractType: string;

    @ApiProperty({
        description: 'Start date of the contract',
        example: '2025-01-01',
    })
    @IsDateString()
    @IsNotEmpty()
    startDate: Date;

    @ApiPropertyOptional({
        description: 'End date of the contract',
        example: '2026-01-01',
    })
    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Contract status',
        enum: ContractStatusType,
        default: ContractStatusType.PENDING,
    })
    @IsEnum(ContractStatusType)
    @IsOptional()
    status?: ContractStatusType = ContractStatusType.PENDING;

    @ApiPropertyOptional({ description: 'Additional notes or description' })
    @IsString()
    @IsOptional()
    description?: string;
}
