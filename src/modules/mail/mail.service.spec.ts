import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should send welcome email', async () => {
    await service.sendWelcomeEmail('test@example.com', 'Test User');

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Chào mừng bạn đến với Dịch vụ Y tế Giới tính',
      template: './welcome',
      context: expect.objectContaining({
        userName: 'Test User',
        appName: 'Dịch vụ Y tế Giới tính',
      }),
    });
  });
});
