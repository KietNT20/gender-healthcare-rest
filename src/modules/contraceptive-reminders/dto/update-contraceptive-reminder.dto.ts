import { PartialType } from '@nestjs/mapped-types';
import { CreateContraceptiveReminderDto } from './create-contraceptive-reminder.dto';

export class UpdateContraceptiveReminderDto extends PartialType(
    CreateContraceptiveReminderDto,
) {}
