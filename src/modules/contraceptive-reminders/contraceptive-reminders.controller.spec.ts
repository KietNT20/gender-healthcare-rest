import { Test, TestingModule } from '@nestjs/testing';
import { ContraceptiveRemindersController } from './contraceptive-reminders.controller';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';

describe('ContraceptiveRemindersController', () => {
    let controller: ContraceptiveRemindersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContraceptiveRemindersController],
            providers: [ContraceptiveRemindersService],
        }).compile();

        controller = module.get<ContraceptiveRemindersController>(
            ContraceptiveRemindersController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
