import { Queue, QueueEvents, Worker } from 'bullmq';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EmailPayload, EmailDeliveryResult } from './mail.interface';

// Redis contains ciphertext only. Never reuse an authentication/JWT secret for this key.
export class EmailQueue {
  private readonly queue: Queue;
  private readonly events: QueueEvents;
  private readonly worker: Worker;
  private readonly key: Buffer;
  constructor(
    url: string,
    key: string,
    deliver: (payload: EmailPayload) => Promise<EmailDeliveryResult>,
  ) {
    this.key = Buffer.from(key, 'base64');
    if (this.key.length !== 32)
      throw new Error('MAIL_QUEUE_KEY must encode 32 random bytes.');
    const parsed = new URL(url);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: decodeURIComponent(parsed.username) || undefined,
      password: decodeURIComponent(parsed.password) || undefined,
      db: Number(parsed.pathname.slice(1) || 0),
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
      connectTimeout: 5000,
    };
    if (!['redis:', 'rediss:'].includes(parsed.protocol))
      throw new Error('Invalid mail Redis protocol.');
    const name = 'niral-transactional-email';
    this.queue = new Queue(name, {
      connection: { ...connection, maxRetriesPerRequest: 1 },
    });
    this.events = new QueueEvents(name, { connection });
    this.worker = new Worker(
      name,
      async (job) => {
        const data = job.data as { iv: string; tag: string; body: string };
        const decipher = createDecipheriv(
          'aes-256-gcm',
          this.key,
          Buffer.from(data.iv, 'base64'),
        );
        decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
        const payload = JSON.parse(
          Buffer.concat([
            decipher.update(Buffer.from(data.body, 'base64')),
            decipher.final(),
          ]).toString(),
        ) as EmailPayload;
        // Bound stalled/restarted jobs; an old bearer link must not be sent days later.
        if (Date.now() - job.timestamp > 60000)
          throw new Error('Email job expired.');
        const result = await deliver(payload);
        if (!result.success) throw new Error('Email delivery failed.');
        return { success: true, messageId: result.messageId };
      },
      { connection, concurrency: 2, maxStalledCount: 0 },
    );
    // Do not print Redis URLs, message bodies, addresses or provider error details.
    this.queue.on('error', () => undefined);
    this.events.on('error', () => undefined);
    this.worker.on('error', () => undefined);
  }
  async ready() {
    await Promise.all([
      this.queue.waitUntilReady(),
      this.events.waitUntilReady(),
      this.worker.waitUntilReady(),
    ]);
  }
  async send(payload: EmailPayload): Promise<EmailDeliveryResult> {
    try {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', this.key, iv);
      const body = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final(),
      ]);
      const job = await this.queue.add(
        'deliver',
        {
          iv: iv.toString('base64'),
          tag: cipher.getAuthTag().toString('base64'),
          body: body.toString('base64'),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600, count: 100 },
          removeOnFail: { age: 3600, count: 100 },
        },
      );
      // Existing account API reports acceptance only after the worker actually delivers.
      return (await job.waitUntilFinished(
        this.events,
        45000,
      )) as EmailDeliveryResult;
    } catch {
      return {
        success: false,
        error: 'Email delivery is unavailable. Please try again later.',
      };
    }
  }
  async close() {
    await this.worker.close();
    await this.events.close();
    await this.queue.close();
  }
}
