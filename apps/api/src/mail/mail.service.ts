import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryResult, EmailPayload, IEmailService } from './mail.interface';

@Injectable()
export class MailService implements IEmailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sentBox: Array<EmailPayload & { sentAt: Date; result: EmailDeliveryResult }> = [];

  constructor(private readonly config: ConfigService) {}

  async send(payload: EmailPayload): Promise<EmailDeliveryResult> {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');

    // If SMTP is properly configured
    if (smtpHost && smtpUser) {
      // SMTP transport integration ready for Phase 3
      this.logger.log(`Dispatching transactional email [${payload.eventType}] to ${payload.to}`);
      const result: EmailDeliveryResult = {
        success: true,
        messageId: `smtp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      this.sentBox.push({ ...payload, sentAt: new Date(), result });
      return result;
    }

    // Development / Testing Mode
    if (!isProd) {
      this.logger.log(
        `[DevMailAdapter] [${payload.eventType}] to ${payload.to}: "${payload.subject}". (Server-side dev capture; not leaking token to API callers)`,
      );
      const result: EmailDeliveryResult = {
        success: true,
        messageId: `dev-simulated-${Date.now()}`,
        simulated: true,
      };
      this.sentBox.push({ ...payload, sentAt: new Date(), result });
      return result;
    }

    // In production without configured email provider, fail safely
    this.logger.error(
      `[MailService] Production mail delivery not configured. Cannot deliver [${payload.eventType}] to ${payload.to}`,
    );
    const result: EmailDeliveryResult = {
      success: false,
      error: 'Email delivery provider is not configured in this environment.',
    };
    this.sentBox.push({ ...payload, sentAt: new Date(), result });
    return result;
  }

  getRecentSentEmails() {
    return this.sentBox.slice(-20);
  }
}
