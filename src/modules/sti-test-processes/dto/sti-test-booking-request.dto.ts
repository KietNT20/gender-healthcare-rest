import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
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
    servicePackageId?: string;

    @ApiPropertyOptional({
        description: 'Array of service IDs',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    serviceIds?: string[];

    @ApiPropertyOptional({
        description: 'Appointment date',
        example: '2024-01-15T10:00:00Z',
    })
    @IsDateString()
    @IsOptional()
    appointmentDate?: Date;

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
