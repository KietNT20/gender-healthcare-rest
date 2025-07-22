import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { TransformEmptyStringToUndefined } from 'src/decorators/transform-null.decorator';

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

    @ApiProperty({
        description: 'Danh sách các chuyên môn của tư vấn viên',
        type: [String],
    })
    @Transform(({ value }) => {
        // Nếu giá trị là null hoặc undefined, trả về mảng rỗng.
        if (value === null || value === undefined) {
            return [];
        }
        // Nếu giá trị đã là một mảng (do client gửi nhiều field cùng tên).
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim());
        }
        // Nếu giá trị là một chuỗi (do client gửi 1 field duy nhất).
        return String(value)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    })
    @IsArray()
    @IsString({ each: true })
    specialties: Array<string>;

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
    @TransformEmptyStringToUndefined()
    bio?: string;
}

export class RegisterConsultantFileDto {
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

export class RegisterConsultantDto extends IntersectionType(
    RegisterConsultantDataDto,
    RegisterConsultantFileDto,
) {}
