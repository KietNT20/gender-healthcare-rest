import {
    IsUUID,
    IsOptional,
    IsString,
    IsArray,
    IsEnum,
    IsDate,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatusType, LocationTypeEnum } from 'src/enums';

export class CreateAppointmentDto {
    @IsDate()
    @Type(() => Date)
    appointmentDate: Date;

    @IsEnum(AppointmentStatusType)
    @IsOptional()
    status?: AppointmentStatusType;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    meetingLink?: string;

    @IsUUID()
    @IsNotEmpty({ message: 'userId is required' })
    userId: string;

    @IsUUID()
    @IsNotEmpty({ message: 'consultantId is required' })
    consultantId: string;

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    services?: string[];

    @IsEnum(LocationTypeEnum)
    @IsOptional()
    appointmentLocation?: LocationTypeEnum;

    @IsOptional()
    fixedPrice?: number;


}
