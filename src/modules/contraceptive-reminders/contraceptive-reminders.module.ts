import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ContraceptiveRemindersController } from './contraceptive-reminders.controller';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';
import { ContraceptiveReminder } from './entities/contraceptive-reminder.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ContraceptiveReminder, User]),
        BullModule.registerQueue({
            name: 'notification-queue',
        }),
    ],
    controllers: [ContraceptiveRemindersController],
    providers: [ContraceptiveRemindersService],
    exports: [ContraceptiveRemindersService],
})
export class ContraceptiveRemindersModule {}
