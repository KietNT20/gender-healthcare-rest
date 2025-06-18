import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
export class CreatePaymentDto {
    @IsNumber()
    @Min(1000)
    amount: number;

    @IsOptional()
    @IsString()
    description?: string;
 
    @IsUUID()
    userId: string;

    @IsOptional()
    @IsUUID()
    appointmentId?: string;
}