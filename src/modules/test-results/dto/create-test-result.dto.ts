import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { TestResultDataDto } from './test-result-data.dto';

export class CreateTestResultDto {
    @ApiProperty({
        description: 'ID of the appointment this result belongs to',
    })
    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @ApiProperty({
        description: 'Structured result data in standardized format',
        type: TestResultDataDto,
    })
    @ValidateNested()
    @Type(() => TestResultDataDto)
    resultData: TestResultDataDto;

    @ApiPropertyOptional({
        description: 'A brief summary of the result',
        example: 'Normal glucose levels, high cholesterol.',
    })
    @IsString()
    @IsOptional()
    resultSummary?: string;

    @ApiProperty({
        description: 'Flag indicating if the result is abnormal',
        default: false,
    })
    @IsBoolean()
    isAbnormal: boolean = false;

    @ApiPropertyOptional({
        description: 'Recommendations from the consultant',
    })
    @IsString()
    @IsOptional()
    recommendation?: string;

    @ApiPropertyOptional({
        description: 'Flag indicating if a follow-up is required',
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    followUpRequired: boolean = false;
}

export class CreateTestResultWithFileDto extends CreateTestResultDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'The test result file (e.g., PDF report)',
    })
    file: any;
}
