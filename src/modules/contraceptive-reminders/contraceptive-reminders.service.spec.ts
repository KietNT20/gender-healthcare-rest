import { Test, TestingModule } from '@nestjs/testing';
import { ContraceptiveRemindersService } from './contraceptive-reminders.service';

describe('ContraceptiveRemindersService', () => {
  let service: ContraceptiveRemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContraceptiveRemindersService],
    }).compile();

    service = module.get<ContraceptiveRemindersService>(ContraceptiveRemindersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
