import MailComposer from 'nodemailer/lib/mail-composer';
import type { ConfigService } from '@nestjs/config';
import type { EmailPayload, EmailDeliveryResult } from './mail.interface';

// Separate from Google sign-in. This refresh token must have only gmail.send consent.
export async function sendGmail(
  config: ConfigService,
  payload: EmailPayload,
): Promise<EmailDeliveryResult> {
  const clientId = config.get<string>('GMAIL_SEND_CLIENT_ID');
  const clientSecret = config.get<string>('GMAIL_SEND_CLIENT_SECRET');
  const refreshToken = config.get<string>('GMAIL_SEND_REFRESH_TOKEN');
  const from = config.get<string>('EMAIL_FROM');
  if (
    config.get('NODE_ENV') !== 'production' ||
    !clientId ||
    !clientSecret ||
    !refreshToken ||
    !from
  )
    return { success: false, error: 'Gmail sending is not enabled.' };
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(5000),
    });
    const token = (await tokenResponse.json()) as {
      access_token?: string;
      scope?: string;
    };
    if (!tokenResponse.ok || !token.access_token)
      throw new Error('Gmail authorization failed.');
    // Scope is returned by Google when available; reject broad/extra scopes.
    if (token.scope !== 'https://www.googleapis.com/auth/gmail.send')
      throw new Error('Incorrect Gmail sending scope.');
    const mime = await new MailComposer({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    })
      .compile()
      .build();
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: mime.toString('base64url') }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = (await response.json()) as { id?: string };
    return response.ok && result.id
      ? { success: true, messageId: result.id }
      : { success: false, error: 'Gmail did not accept the message.' };
  } catch {
    return { success: false, error: 'Gmail delivery is unavailable.' };
  }
}
