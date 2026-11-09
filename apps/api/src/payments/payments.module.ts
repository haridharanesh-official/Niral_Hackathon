import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import {
  MasterPaymentsController,
  PaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsWorker } from './payments.worker';
import { UpiConfig } from './upi/upi-config';
import { UpiService } from './upi/upi.service';
import { GmailReconciliationService } from './upi/gmail-reconciliation.service';
@Module({
  imports: [MailModule],
  controllers: [PaymentsController, MasterPaymentsController],
  providers: [
    PaymentsService,
    PaymentsWorker,
    UpiConfig,
    UpiService,
    GmailReconciliationService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
