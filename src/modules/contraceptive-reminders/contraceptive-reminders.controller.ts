import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';
import { CreateContraceptiveReminderDto } from './dto/create-contraceptive-reminder.dto';
import { UpdateContraceptiveReminderDto } from './dto/update-contraceptive-reminder.dto';

@Controller('contraceptive-reminders')
export class ContraceptiveRemindersController {
  constructor(private readonly contraceptiveRemindersService: ContraceptiveRemindersService) {}

  @Post()
  create(@Body() createContraceptiveReminderDto: CreateContraceptiveReminderDto) {
    return this.contraceptiveRemindersService.create(createContraceptiveReminderDto);
  }

  @Get()
  findAll() {
    return this.contraceptiveRemindersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contraceptiveRemindersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContraceptiveReminderDto: UpdateContraceptiveReminderDto) {
    return this.contraceptiveRemindersService.update(+id, updateContraceptiveReminderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contraceptiveRemindersService.remove(+id);
  }
}
