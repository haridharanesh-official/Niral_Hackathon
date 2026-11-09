import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpiConfig } from './upi/upi-config';
import { escapeHtml, money, requireFeeScope } from './payment-rules';
import { PaymentSettingsDto } from './payments.dto';

const includeOrder = {
  coveredEnrollments: {
    select: {
      enrollmentId: true,
      enrollment: {
        select: { registrationId: true, userId: true, status: true },
      },
    },
  },
  upiCase: {
    select: {
      state: true,
      utrMasked: true,
      refund: { select: { amountMinor: true, status: true } },
    },
  },
  transactions: { include: { refunds: true } },
  enrollment: { select: { registrationId: true, status: true } },
} as const;
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upiConfig: UpiConfig,
    private readonly mail: MailService,
  ) {}
  private async serial<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2034' &&
          attempt < 2
        )
          continue;
        throw e;
      }
    }
  }
  async master(actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (
      !actor ||
      actor.role !== 'ADMIN' ||
      actor.accountStatus !== 'ACTIVE' ||
      !actor.emailVerified
    )
      throw new ForbiddenException(
        'Verified active Master access is required.',
      );
  }
  async publicConfig() {
    const event = await this.prisma.event.findFirst({
      where: { isActive: true, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!event)
      return {
        mode: 'DISABLED',
        collection: this.upiConfig.status(),
        event: null,
      };
    return {
      mode: event.registrationPaymentMode,
      provider: event.paymentProvider,
      amountMinor: event.feeAmountMinor,
      taxAmountMinor: event.taxAmountMinor,
      currency: event.feeCurrency,
      feeScope: event.feeScope,
      approved: !!event.feeApprovedAt,
      paymentPolicyUrl: event.paymentPolicyUrl,
      refundPolicyUrl: event.refundPolicyUrl,
      cancellationPolicyUrl: event.cancellationPolicyUrl,
      collection: this.upiConfig.status(),
      event: {
        id: event.id,
        name: event.name,
        registrationEnabled: event.registrationEnabled,
      },
    };
  }
  async owned(id: string, userId: string) {
    const order = await this.prisma.paymentOrder.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { coveredEnrollments: { some: { enrollment: { userId } } } },
        ],
      },
      include: includeOrder,
    });
    if (!order) throw new NotFoundException('Payment reference not found.');
    return order;
  }
  async status(id: string, userId: string) {
    return this.owned(id, userId);
  }
  async mine(userId: string) {
    return this.prisma.paymentOrder.findMany({
      where: {
        OR: [
          { userId },
          { coveredEnrollments: { some: { enrollment: { userId } } } },
        ],
      },
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
  async updateSettings(
    actorId: string,
    eventId: string,
    dto: PaymentSettingsDto,
  ) {
    await this.master(actorId);
    money(dto.amountMinor);
    money(dto.taxAmountMinor);
    money(dto.amountMinor + dto.taxAmountMinor);
    if (dto.mode === 'PAID') {
      requireFeeScope(dto.feeScope);
      if (
        !dto.feeApproved ||
        dto.amountMinor < 100 ||
        !dto.receiptIssuer?.trim() ||
        !dto.paymentPolicyUrl ||
        !dto.refundPolicyUrl ||
        !dto.cancellationPolicyUrl
      )
        throw new BadRequestException(
          'Approved fee, receipt issuer, HTTPS terms and refund policy are required.',
        );
      this.upiConfig.ensure(dto.provider ?? 'MANUAL_UPI');
      for (const value of [
        dto.paymentPolicyUrl,
        dto.refundPolicyUrl,
        dto.cancellationPolicyUrl,
      ]) {
        try {
          const url = new URL(value);
          if (
            url.protocol !== 'https:' ||
            !url.hostname ||
            url.username ||
            url.password
          )
            throw Error();
        } catch {
          throw new BadRequestException(
            'Published HTTPS payment, refund and cancellation policies are required.',
          );
        }
      }
    }
    if (dto.mode === 'FREE' && (dto.amountMinor || dto.taxAmountMinor))
      throw new BadRequestException(
        'Free enrollment cannot request a fee or tax.',
      );
    if (dto.confirmPublish !== true)
      throw new BadRequestException(
        'Explicit publishing confirmation is required.',
      );
    return this.serial(async (tx) => {
      const event = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
      });
      if (
        event.paymentSettingsVersion !== dto.expectedVersion ||
        (event.feeAmountMinor ?? 0) !== dto.expectedOldAmountMinor
      )
        throw new ConflictException(
          'Fee settings changed. Review the old and new amounts again.',
        );
      const updated = await tx.event.update({
        where: { id: eventId },
        data: {
          registrationPaymentMode: dto.mode,
          paymentProvider: dto.provider ?? 'MANUAL_UPI',
          feeAmountMinor: dto.amountMinor,
          taxAmountMinor: dto.taxAmountMinor,
          feeCurrency: dto.currency,
          feeScope: dto.feeScope,
          feeApprovedAt: dto.feeApproved ? new Date() : null,
          paymentPolicyUrl: dto.paymentPolicyUrl ?? null,
          refundPolicyUrl: dto.refundPolicyUrl ?? null,
          cancellationPolicyUrl: dto.cancellationPolicyUrl ?? null,
          receiptIssuer: dto.receiptIssuer ?? null,
          paymentSettingsVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'PAYMENT_SETTINGS_PUBLISHED',
          resource: 'event',
          metadata: {
            eventId,
            oldMode: event.registrationPaymentMode,
            newMode: dto.mode,
            provider: dto.provider ?? 'MANUAL_UPI',
            oldScope: event.feeScope,
            newScope: dto.feeScope,
            oldAmountMinor: event.feeAmountMinor,
            newAmountMinor: dto.amountMinor,
            taxAmountMinor: dto.taxAmountMinor,
            version: updated.paymentSettingsVersion,
          },
        },
      });
      return updated;
    });
  }
  async masterList(actorId: string) {
    await this.master(actorId);
    return this.prisma.paymentOrder.findMany({
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
  async summary(actorId: string) {
    await this.master(actorId);
    const [payments, enrollments] = await Promise.all([
      this.prisma.paymentOrder.groupBy({
        by: ['status', 'currency', 'environment'],
        _count: { _all: true },
        _sum: { amountMinor: true },
      }),
      this.prisma.eventEnrollment.groupBy({
        by: ['eventId', 'status'],
        _count: { _all: true },
      }),
    ]);
    return { payments, enrollments, collection: this.upiConfig.status() };
  }
  async sendNotifications() {
    const rows = await this.prisma.paymentNotification.findMany({
      where: { status: 'PENDING', nextAttemptAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    for (const row of rows) {
      const claim = await this.prisma.paymentNotification.updateMany({
        where: {
          id: row.id,
          status: 'PENDING',
          nextAttemptAt: { lte: new Date() },
        },
        data: {
          nextAttemptAt: new Date(Date.now() + 120000),
          attempts: { increment: 1 },
        },
      });
      if (!claim.count) continue;
      const user = await this.prisma.user.findUnique({
        where: { id: row.userId },
        select: { email: true },
      });
      const result = user
        ? await this.mail.send({
            to: user.email,
            subject: row.subject,
            eventType: row.eventType,
            html: `<div style="font-family:Arial;color:#111;border:2px solid #111;padding:24px"><h1 style="background:#fd9b9b;padding:12px">NIRAL 2026</h1><p>${escapeHtml(row.body)}</p></div>`,
            text: row.body,
          })
        : { success: false };
      await this.prisma.paymentNotification.update({
        where: { id: row.id },
        data: result.success
          ? { status: 'SENT', sentAt: new Date() }
          : {
              nextAttemptAt: new Date(
                Date.now() +
                  Math.min(86400000, 60000 * 2 ** Math.min(row.attempts, 10)),
              ),
            },
      });
    }
  }
  async receipt(id: string, userId: string) {
    const order = await this.owned(id, userId);
    const captured = order.transactions.find((t) => t.capturedAt);
    if (!captured)
      throw new ConflictException(
        'A receipt is available only for verified captured payment.',
      );
    const policy = order.policySnapshot as Record<string, unknown>;
    const amount = (order.amountMinor / 100).toFixed(2),
      tax = (order.taxAmountMinor / 100).toFixed(2);
    return `<!doctype html><html lang="en"><meta charset="utf-8"><title>NIRAL payment receipt</title><body style="font-family:Arial;color:#111;max-width:720px;margin:40px auto;padding:24px;border:2px solid #111"><h1 style="background:#fd9b9b;padding:16px">NIRAL · Payment receipt</h1><p>Issuer: ${escapeHtml(policy.receiptIssuer)}</p><p>Event: ${escapeHtml(policy.eventName)}</p><p>Registration: ${escapeHtml(order.enrollment.registrationId)}</p><p>Reference: ${escapeHtml(order.id)}</p>${order.billingTeamId ? `<p>Fixed team fee for ${escapeHtml(order.teamNameSnapshot)}. Covered registrations: ${escapeHtml(order.coveredEnrollments.map((c) => c.enrollment.registrationId).join(', '))}</p>` : ''}<p>Transaction reference: ${escapeHtml(captured.providerPaymentId)}</p><p>Captured: ${escapeHtml(captured.capturedAt?.toISOString())}</p><p>Total paid: ${escapeHtml(order.currency)} ${amount}</p><p>Included configured tax: ${tax}</p><p>Environment: ${escapeHtml(order.environment)}</p><p>Current status: ${escapeHtml(order.status)}</p><p>This is a payment acknowledgement, not a GST tax invoice. Refund status is available in your authenticated payment history.</p></body></html>`;
  }
}
