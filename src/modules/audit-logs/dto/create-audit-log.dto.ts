import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateAuditLogDto {
    @ApiProperty({ description: 'The user who performed the action.' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        description: 'The action performed (e.g., CREATE, UPDATE, DELETE).',
        example: 'UPDATE',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    action: string;

    @ApiProperty({
        description: 'The type of entity that was affected.',
        example: 'User',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    entityType: string;

    @ApiProperty({ description: 'The ID of the affected entity.' })
    @IsUUID()
    @IsNotEmpty()
    entityId: string;

    @ApiPropertyOptional({
        description: 'The state of the entity before the change (JSON format).',
    })
    @IsOptional()
    @IsObject()
    oldValues?: any;

    @ApiPropertyOptional({
        description: 'The state of the entity after the change (JSON format).',
    })
    @IsOptional()
    @IsObject()
    newValues?: any;

    @ApiPropertyOptional({
        description: 'Additional details about the action.',
    })
    @IsOptional()
    @IsString()
    details?: string;

    @ApiPropertyOptional({
        description: 'The status of the action (success/failure).',
        default: 'success',
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    status?: string = 'success';
}
