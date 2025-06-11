import { Module } from '@nestjs/common';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';
import { ContraceptiveRemindersController } from './contraceptive-reminders.controller';

@Module({
    controllers: [ContraceptiveRemindersController],
    providers: [ContraceptiveRemindersService],
})
export class ContraceptiveRemindersModule {}
