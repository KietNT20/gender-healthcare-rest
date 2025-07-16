import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';

export class RenewEmploymentContractDto {
    @ApiProperty({ description: 'ID of the old contract' })
    @IsUUID('4')
    @IsNotEmpty()
    oldContractId: string;

    @ApiProperty({ description: 'New start date' })
    @IsDate()
    @IsNotEmpty()
    startDate: Date;

    @ApiProperty({ description: 'New end date' })
    @IsDate()
    @IsNotEmpty()
    endDate: Date;
}

class RenewEmploymentContractFileDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'The contract file (PDF)',
    })
    file: any;
}

export class RenewEmploymentContractBodyDto extends IntersectionType(
    RenewEmploymentContractDto,
    RenewEmploymentContractFileDto,
) {}
