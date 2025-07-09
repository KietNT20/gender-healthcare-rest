import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { TestResultDataDto } from './test-result-data.dto';

export class CreateTestResultDto {
    @ApiPropertyOptional({
        description:
            'ID of the appointment this result belongs to (for online booking)',
        example: 'Required if patientId and serviceId are not provided',
    })
    @IsUUID('4')
    @ValidateIf((o) => !o.patientId || !o.serviceId)
    @IsNotEmpty()
    appointmentId?: string;

    @ApiPropertyOptional({
        description: 'ID of the patient (for walk-in cases)',
        example: 'Required if appointmentId is not provided',
    })
    @IsUUID('4')
    @ValidateIf((o) => !o.appointmentId)
    @IsNotEmpty()
    patientId?: string;

    @ApiPropertyOptional({
        description: 'ID of the service (for walk-in cases)',
        example: 'Required if appointmentId is not provided',
    })
    @IsUUID('4')
    @ValidateIf((o) => !o.appointmentId)
    @IsNotEmpty()
    serviceId?: string;

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
    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'The test result file (e.g., PDF report)',
    })
    file: any;
}
