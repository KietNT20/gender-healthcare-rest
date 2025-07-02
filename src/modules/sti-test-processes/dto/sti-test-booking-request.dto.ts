import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
} from 'class-validator';

export class StiTestBookingRequest {
    @ApiProperty({
        description: 'Patient ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    patientId: string;

    @ApiPropertyOptional({
        description: 'Service package ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    @ValidateIf((o) => !o.serviceIds || o.serviceIds.length === 0)
    servicePackageId?: string;

    @ApiPropertyOptional({
        description: 'Array of service IDs',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    @ValidateIf((o) => !o.servicePackageId)
    serviceIds?: string[];

    @ApiPropertyOptional({
        description: 'Appointment ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    appointmentId?: string;

    @ApiPropertyOptional({
        description: 'Consultant ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    consultantId?: string;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Patient prefers morning appointment',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
