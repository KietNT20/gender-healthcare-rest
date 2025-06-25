import { ApiProperty } from '@nestjs/swagger';
import { WebhookDataType } from '@payos/node/lib/type';
import { IsBoolean, IsString } from 'class-validator';

export class WebhookTypeDTO {
    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsString()
    desc: string;

    @ApiProperty()
    @IsBoolean()
    success: boolean;

    @ApiProperty({
        description: 'Kiểu dữ liệu WebhookDataType của PayOS',
    })
    data: WebhookDataType;

    @ApiProperty()
    @IsString()
    signature: string;
}
