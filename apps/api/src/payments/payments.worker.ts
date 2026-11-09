import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { UpiService } from './upi/upi.service';
import { GmailReconciliationService } from './upi/gmail-reconciliation.service';
@Injectable()
export class PaymentsWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private readonly logger = new Logger(PaymentsWorker.name);
  constructor(
    private readonly config: ConfigService,
    private readonly payments: PaymentsService,
    private readonly upi: UpiService,
    private readonly gmail: GmailReconciliationService,
  ) {}
  onModuleInit() {
    if (
      this.config.get('PAYMENT_WORKER_ENABLED') === 'true' ||
      this.config.get('UPI_RECONCILIATION_WORKER_ENABLED') === 'true'
    ) {
      this.timer = setInterval(() => void this.tick(), 30000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      if (this.config.get('UPI_RECONCILIATION_WORKER_ENABLED') === 'true') {
        await this.upi.expire();
        await this.upi.reconcilePending();
        if (this.config.get('GMAIL_RECONCILIATION_ENABLED') === 'true')
          await this.gmail.poll();
      }
    } catch {
      this.logger.warn(
        'UPI reconciliation unavailable; review durable queue. No settlement inferred.',
      );
    }
    try {
      await this.payments.sendNotifications();
    } catch {
      this.logger.warn('Payment notifications retained for retry.');
    } finally {
      this.busy = false;
    }
  }
}
