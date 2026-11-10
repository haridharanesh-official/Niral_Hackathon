import { EmailQueue } from './email-queue';
import { sendGmail } from './gmail-sender';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import {
  EmailDeliveryResult,
  EmailPayload,
  IEmailService,
} from './mail.interface';

@Injectable()
export class MailService
  implements IEmailService, OnModuleInit, OnModuleDestroy
{
  private queue?: EmailQueue;
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly config: ConfigService) {}
  async onModuleInit() {
    if (this.config.get('MAIL_QUEUE_ENABLED') !== 'true') return;
    const url = this.config.get<string>('REDIS_URL');
    const key = this.config.get<string>('MAIL_QUEUE_KEY');
    if (!url || !key) {
      this.logger.warn(
        'Email queue configuration incomplete — fallback to direct delivery',
      );
      return;
    }
    try {
      this.queue = new EmailQueue(url, key, (payload) => this.deliver(payload));
      await Promise.race([
        this.queue.ready(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis connection timed out')),
            2500,
          ),
        ),
      ]);
    } catch (err) {
      this.logger.warn(
        `Mail queue unavailable (${(err as Error).message}) — fallback to direct delivery`,
      );
      this.queue = undefined;
    }
  }
  async onModuleDestroy() {
    await this.queue?.close();
  }
  async send(payload: EmailPayload): Promise<EmailDeliveryResult> {
    if (this.config.get('MAIL_QUEUE_ENABLED') === 'true' && this.queue)
      return this.queue.send(payload);
    return this.deliver(payload);
  }
  private async deliver(payload: EmailPayload): Promise<EmailDeliveryResult> {
    if (this.config.get('EMAIL_PROVIDER') === 'gmail')
      return sendGmail(this.config, payload);

    const host = this.config.get<string>('SMTP_HOST');
    const from = this.config.get<string>('EMAIL_FROM');
    if (!host || !from)
      return {
        success: false,
        error: 'Email delivery is unavailable. Please try again later.',
      };
    const local = [
      'localhost',
      '127.0.0.1',
      '::1',
      'mailpit',
      'mailhog',
    ].includes(host);
    if (this.config.get('NODE_ENV') !== 'production' && !local)
      return {
        success: false,
        error: 'Local email capture is not configured.',
      };
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const port = Number(this.config.get('SMTP_PORT') ?? (local ? 1025 : 587));
    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: !local && port !== 465,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: true },
    });
    try {
      const result = await transport.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      if (!result.accepted.length)
        return {
          success: false,
          error: 'The email server did not accept the message.',
        };
      return { success: true, messageId: result.messageId };
    } catch {
      this.logger.warn(`Transactional email failed: ${payload.eventType}`);
      return {
        success: false,
        error: 'Email delivery is unavailable. Please try again later.',
      };
    } finally {
      transport.close();
    }
  }
}
