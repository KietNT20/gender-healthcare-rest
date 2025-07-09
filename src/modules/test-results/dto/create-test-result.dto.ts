import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsJSON,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
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
    @IsJSON()
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

    @ApiPropertyOptional({
        description: 'Notes for follow-up actions or observations',
        example: 'Patient should return in 2 weeks for re-evaluation.',
    })
    @IsString()
    @IsOptional()
    followUpNotes?: string;
}

export class FileDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'The test result file (PDF report)',
    })
    file: any;
}

export class CreateTestResultWithFileDto extends IntersectionType(
    CreateTestResultDto,
    FileDto,
) {}
