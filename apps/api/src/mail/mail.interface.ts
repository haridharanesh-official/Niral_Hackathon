export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface IEmailService {
  send(payload: EmailPayload): Promise<EmailDeliveryResult>;
}
