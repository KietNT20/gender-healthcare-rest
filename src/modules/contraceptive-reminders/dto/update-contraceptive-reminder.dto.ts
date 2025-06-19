import { PartialType } from '@nestjs/swagger';
import { CreateContraceptiveReminderDto } from './create-contraceptive-reminder.dto';

export class UpdateContraceptiveReminderDto extends PartialType(
    CreateContraceptiveReminderDto,
) {}
