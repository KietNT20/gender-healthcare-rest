import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateServiceImageDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    serviceId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    imageId: string;
}
