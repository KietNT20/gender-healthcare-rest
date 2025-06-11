import { Injectable } from '@nestjs/common';
import { CreateContraceptiveReminderDto } from './dto/create-contraceptive-reminder.dto';
import { UpdateContraceptiveReminderDto } from './dto/update-contraceptive-reminder.dto';

@Injectable()
export class ContraceptiveRemindersService {
  create(createContraceptiveReminderDto: CreateContraceptiveReminderDto) {
    return 'This action adds a new contraceptiveReminder';
  }

  findAll() {
    return `This action returns all contraceptiveReminders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contraceptiveReminder`;
  }

  update(id: number, updateContraceptiveReminderDto: UpdateContraceptiveReminderDto) {
    return `This action updates a #${id} contraceptiveReminder`;
  }

  remove(id: number) {
    return `This action removes a #${id} contraceptiveReminder`;
  }
}
