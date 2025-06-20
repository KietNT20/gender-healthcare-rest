import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class RegisterConsultantDataDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'First name is required' })
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    specialization: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    qualification: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    experience: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;
}

export class RegisterConsultantDto extends RegisterConsultantDataDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'CV file (PDF, DOCX).',
        required: true,
    })
    cv: any;

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Các file chứng chỉ, bằng cấp (tối đa 5 file).',
        required: true,
    })
    certificates: any[];
}
