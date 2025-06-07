import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  transport: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT as string) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  },
  defaults: {
    from: {
      name: process.env.MAIL_FROM_NAME,
      address: process.env.MAIL_FROM,
    },
  },
  template: {
    dir: process.cwd() + '/src/modules/mail/templates',
    adapter: 'handlebars',
    options: {
      strict: true,
    },
  },
}));
