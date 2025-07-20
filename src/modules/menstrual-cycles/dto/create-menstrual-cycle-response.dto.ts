import { ApiProperty } from '@nestjs/swagger';
import { MenstrualCycle } from '../entities/menstrual-cycle.entity';

export class IrregularityAlert {
    @ApiProperty({
        description: 'Loại rối loạn phát hiện',
        example: 'CYCLE_LENGTH_VARIATION',
    })
    type: string;

    @ApiProperty({
        description: 'Thông báo rối loạn',
        example: 'Chu kỳ này có dấu hiệu bất thường so với các chu kỳ trước.',
    })
    message: string;

    @ApiProperty({
        description: 'Khuyến nghị cho người dùng',
        example: 'Bạn nên theo dõi và tham khảo ý kiến bác sĩ nếu cần.',
    })
    recommendation: string;
}

export class CreateMenstrualCycleResponseDto {
    @ApiProperty({
        description: 'Chu kỳ kinh nguyệt đã được tạo',
        type: MenstrualCycle,
    })
    cycle: MenstrualCycle;

    @ApiProperty({
        description: 'Thông báo rối loạn (nếu có)',
        type: IrregularityAlert,
        required: false,
    })
    irregularityAlert?: IrregularityAlert;
}
