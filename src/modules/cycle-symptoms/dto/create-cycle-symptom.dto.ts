import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCycleSymptomDto {
    @IsNumber()
    @IsOptional()
    intensity?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsUUID('4')
    cycleId: string;

    @IsString()
    @IsUUID('4')
    symptomId: string;
}
