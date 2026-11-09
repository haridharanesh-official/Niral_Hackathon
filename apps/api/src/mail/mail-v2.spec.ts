import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
const payload = {
  to: 'unit@example.test',
  subject: 'Unit test',
  html: '<p>Unit fixture</p>',
  eventType: 'test',
};
describe('SMTP adapter unit contracts (transport mocked; real capture tested separately)', () => {
  beforeEach(() => jest.clearAllMocks());
  it('does not simulate delivery with missing configuration', async () => {
    expect(
      await new MailService(
        new ConfigService({
          NODE_ENV: 'test',
          MAIL_QUEUE_ENABLED: 'false',
          SMTP_HOST: '',
          EMAIL_FROM: '',
        }),
      ).send(payload),
    ).toMatchObject({ success: false });
  });
  it('blocks real recipients in development without local capture', async () => {
    expect(
      await new MailService(
        new ConfigService({
          NODE_ENV: 'test',
          MAIL_QUEUE_ENABLED: 'false',
          SMTP_HOST: 'smtp.example.test',
          EMAIL_FROM: 'unit@example.test',
        }),
      ).send(payload),
    ).toMatchObject({ success: false });
    expect(createTransport).not.toHaveBeenCalled();
  });
  it('reports actual SMTP acceptance and failure', async () => {
    const sendMail = jest.fn().mockResolvedValue({
      accepted: ['unit@example.test'],
      messageId: 'unit',
    });
    jest
      .mocked(createTransport)
      .mockReturnValue({ sendMail, close: jest.fn() } as unknown as ReturnType<
        typeof createTransport
      >);
    const service = new MailService(
      new ConfigService({
        NODE_ENV: 'test',
        MAIL_QUEUE_ENABLED: 'false',
        SMTP_HOST: 'localhost',
        EMAIL_FROM: 'unit@example.test',
      }),
    );
    expect(await service.send(payload)).toMatchObject({ success: true });
    sendMail.mockRejectedValue(new Error('denied'));
    expect(await service.send(payload)).toMatchObject({ success: false });
  });
});
