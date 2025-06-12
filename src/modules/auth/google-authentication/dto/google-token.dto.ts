import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleTokenDto {
    @ApiProperty({
        description: 'Google ID Token received from Google authentication',
    })
    @IsNotEmpty({ message: 'Google token is required' })
    @IsString({ message: 'Google token must be a string' })
    token: string;
}
