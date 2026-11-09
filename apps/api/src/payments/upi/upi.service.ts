import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { UpiConfig } from './upi-config';
import { parseFamAppCredit } from './famapp-parser';
import {
  authenticatedSender,
  encrypt,
  fingerprint,
  GmailHeader,
  mask,
  normalizeUtr,
  parseSyntheticCredit,
  timestampMatches,
} from './upi-rules';
import { UpiCreditVerificationDto, UpiRefundCompleteDto } from './upi.dto';

const safeCase = {
  id: true,
  orderId: true,
  state: true,
  utrMasked: true,
  claimedAt: true,
  verifiedAt: true,
  reviewerId: true,
  reviewedAt: true,
  creditReferenceMasked: true,
  createdAt: true,
  updatedAt: true,
  refund: {
    select: {
      id: true,
      amountMinor: true,
      status: true,
      requestedAt: true,
      completedAt: true,
      evidenceMasked: true,
    },
  },
} as const;
const scrub = (reason: string) =>
  reason.trim().replace(/\b\d{12}\b/g, '[masked transaction]');
@Injectable()
export class UpiService {
  constructor(
    private readonly db: PrismaService,
    private readonly payments: PaymentsService,
    readonly config: UpiConfig,
  ) {}
  private async serial<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2034' &&
          attempt < 4
        )
          continue;
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        )
          throw new ConflictException(
            'A transaction or evidence reference is already allocated. Finance review is required.',
          );
        throw e;
      }
    }
  }
  private async audit(
    tx: Prisma.TransactionClient,
    actorId: string | undefined,
    action: string,
    orderId: string,
    extra: Prisma.InputJsonObject = {},
  ) {
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action,
        resource: 'upi',
        metadata: { orderId, ...extra },
      },
    });
  }
  private async notify(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    state: string,
  ) {
    await tx.paymentNotification.upsert({
      where: { deduplicationKey: `upi:${orderId}:${userId}:${state}` },
      update: {},
      create: {
        deduplicationKey: `upi:${orderId}:${userId}:${state}`,
        userId,
        eventType: `payment.upi.${state.toLowerCase()}`,
        subject:
          state === 'VERIFIED'
            ? 'NIRAL registration confirmed'
            : 'NIRAL payment reconciliation update',
        body: `Payment reference ${orderId}: ${state}. ${state === 'VERIFIED' ? 'Your paid event enrollment is confirmed after independent receiving-account credit review. Your receipt is available in the dashboard.' : 'Check your dashboard or contact support. A payment claim or email alert does not confirm settlement.'}`,
      },
    });
  }
  async create(userId: string, enrollmentId: string) {
    const order = await this.serial(async (tx) => {
      const enrollment = await tx.eventEnrollment.findFirst({
        where: { id: enrollmentId, userId },
        include: { event: true, user: true },
      });
      if (!enrollment) throw new NotFoundException('Enrollment not found.');
      const { event, user } = enrollment;
      if (
        !user.emailVerified ||
        user.accountStatus !== 'ACTIVE' ||
        !['PARTICIPANT', 'TEAM_LEADER'].includes(user.role)
      )
        throw new ForbiddenException(
          'Verified participant access is required.',
        );
      const beneficiary = this.config.ensure(
        enrollment.paymentProviderSnapshot,
        user.email,
      );
      if (
        enrollment.paymentModeSnapshot !== 'PAID' ||
        enrollment.status !== 'PENDING' ||
        !event.registrationEnabled ||
        event.status !== 'REGISTRATION_OPEN' ||
        event.registrationPaymentMode === 'DISABLED' ||
        (event.registrationStartsAt &&
          event.registrationStartsAt > new Date()) ||
        (event.registrationEndsAt && event.registrationEndsAt < new Date())
      )
        throw new ConflictException(
          'This enrollment is not open for checkout.',
        );
      const amountMinor =
        enrollment.feeAmountSnapshot + enrollment.taxAmountSnapshot;
      if (
        !Number.isSafeInteger(amountMinor) ||
        amountMinor < 100 ||
        enrollment.feeCurrencySnapshot !== 'INR'
      )
        throw new ConflictException('Approved INR terms are required.');
      const existing = await tx.paymentOrder.findUnique({
        where: { enrollmentId },
      });
      if (existing) {
        if (existing.provider !== enrollment.paymentProviderSnapshot)
          throw new ConflictException(
            'The enrollment already has a different payment provider.',
          );
        return existing;
      }
      const membership = await tx.teamMember.findFirst({
        where: { userId, team: { eventId: event.id } },
        include: { team: { select: { id: true, name: true, leaderId: true } } },
      });
      let coverageIds: string[] = [];
      if (enrollment.feeScopeSnapshot === 'TEAM') {
        if (!membership || membership.team.leaderId !== userId)
          throw new ForbiddenException(
            'The team leader starts one fixed-fee checkout after the roster is complete.',
          );
        await tx.team.update({
          where: { id: membership.team.id },
          data: { billingLocked: true },
        });
        const members = await tx.teamMember.findMany({
          where: { teamId: membership.team.id },
          include: { user: true },
        });
        const policy = enrollment.paymentPolicySnapshot as Record<
          string,
          unknown
        > | null;
        const min = Number(policy?.minTeamSize ?? event.minTeamSize),
          max = Number(policy?.maxTeamSize ?? event.maxTeamSize);
        if (members.length < min || members.length > max)
          throw new ConflictException(
            'Complete the approved team roster before checkout.',
          );
        const enrollments = await tx.eventEnrollment.findMany({
          where: {
            eventId: event.id,
            userId: { in: members.map((m) => m.userId) },
          },
        });
        if (
          enrollments.length !== members.length ||
          enrollments.some(
            (e) =>
              e.status !== 'PENDING' ||
              e.paymentModeSnapshot !== 'PAID' ||
              e.feeScopeSnapshot !== 'TEAM' ||
              e.feeAmountSnapshot !== enrollment.feeAmountSnapshot ||
              e.taxAmountSnapshot !== enrollment.taxAmountSnapshot ||
              e.feeCurrencySnapshot !== enrollment.feeCurrencySnapshot ||
              e.paymentProviderSnapshot !==
                enrollment.paymentProviderSnapshot ||
              JSON.stringify(e.paymentPolicySnapshot) !==
                JSON.stringify(enrollment.paymentPolicySnapshot),
          )
        )
          throw new ConflictException(
            'All members must hold matching pending enrollment and approved team-price terms.',
          );
        for (const member of members) {
          if (
            !member.user.emailVerified ||
            member.user.accountStatus !== 'ACTIVE' ||
            !['PARTICIPANT', 'TEAM_LEADER'].includes(member.user.role)
          )
            throw new ConflictException(
              'Every covered team member must be an active verified participant.',
            );
          this.config.ensure(
            enrollment.paymentProviderSnapshot,
            member.user.email,
          );
        }
        coverageIds = enrollments.map((e) => e.id);
      }
      const created = await tx.paymentOrder.create({
        data: {
          enrollmentId,
          eventId: event.id,
          userId,
          teamId: membership?.team.id,
          teamNameSnapshot: membership?.team.name,
          billingTeamId:
            enrollment.feeScopeSnapshot === 'TEAM' ? membership!.team.id : null,
          ...(coverageIds.length
            ? {
                coveredEnrollments: {
                  create: coverageIds.map((id) => ({ enrollmentId: id })),
                },
              }
            : {}),
          provider: enrollment.paymentProviderSnapshot,
          environment: 'test',
          amountMinor,
          taxAmountMinor: enrollment.taxAmountSnapshot,
          currency: 'INR',
          paymentMode: 'PAID',
          status: 'PENDING',
          policySnapshot: enrollment.paymentPolicySnapshot ?? {},
          expiresAt:
            event.registrationEndsAt ?? new Date(Date.now() + 86400000),
          upiCase: { create: { beneficiary } },
        },
      });
      await this.audit(tx, userId, 'UPI_TEST_ORDER_CREATED', created.id, {
        provider: created.provider,
        amountMinor,
      });
      return created;
    });
    return this.checkout(userId, order.id);
  }
  async detail(userId: string, orderId: string) {
    const order = await this.db.paymentOrder.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId },
          { coveredEnrollments: { some: { enrollment: { userId } } } },
        ],
        provider: { in: ['MANUAL_UPI', 'FAMAPP_SANDBOX'] },
      },
      select: {
        id: true,
        userId: true,
        billingTeamId: true,
        coveredEnrollments: {
          select: {
            enrollmentId: true,
            enrollment: { select: { registrationId: true } },
          },
        },
        amountMinor: true,
        currency: true,
        environment: true,
        provider: true,
        status: true,
        enrollment: { select: { registrationId: true, status: true } },
        upiCase: { select: safeCase },
      },
    });
    if (!order) throw new NotFoundException('Payment reference not found.');
    return order;
  }
  async checkout(userId: string, orderId: string) {
    const detail = await this.detail(userId, orderId);
    if (detail.userId !== userId)
      throw new ForbiddenException(
        'Only the authorized team payer can display checkout or submit a payment claim.',
      );
    const [record, user] = await Promise.all([
      this.db.upiReconciliation.findUniqueOrThrow({ where: { orderId } }),
      this.db.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    this.config.ensure(detail.provider, user.email);
    const order = await this.db.paymentOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    const payable =
      record.state === 'PENDING' &&
      order.status === 'PENDING' &&
      (!order.expiresAt || order.expiresAt > new Date());
    // No wallet address or QR appears on normal histories or closed claims.
    if (!payable) return { ...detail, checkout: null };
    const uri = new URL('upi://pay');
    uri.search = new URLSearchParams({
      pa: record.beneficiary,
      pn: 'NIRAL authorized personal test',
      am: (detail.amountMinor / 100).toFixed(2),
      cu: 'INR',
      tr: orderId,
      tn: 'AUTHORIZED PERSONAL TEST ONLY',
    }).toString();
    return {
      ...detail,
      checkout: {
        upiId: record.beneficiary,
        upiUri: uri.toString(),
        qrDataUrl: await QRCode.toDataURL(uri.toString(), {
          width: 256,
          margin: 2,
        }),
        instructions:
          'Synthetic / explicitly authorized personal test only. Do not collect hackathon fees here. No email or submitted UTR proves settlement.',
      },
    };
  }
  async claim(userId: string, orderId: string, utrValue: string) {
    const owned = await this.detail(userId, orderId);
    if (owned.userId !== userId)
      throw new ForbiddenException(
        'Only the authorized payer can submit the UTR.',
      );
    const utr = normalizeUtr(utrValue),
      utrHash = fingerprint(`utr:${utr}`, this.config.key);
    await this.serial(async (tx) => {
      const current = await tx.upiReconciliation.findUniqueOrThrow({
        where: { orderId },
        include: { order: { include: { user: true } } },
      });
      this.config.ensure(current.order.provider, current.order.user.email);
      if (current.utrHash === utrHash) return;
      if (
        current.state !== 'PENDING' ||
        (current.order.expiresAt && current.order.expiresAt < new Date())
      )
        throw new ConflictException(
          'This claim is closed or expired. Contact support; do not pay again.',
        );
      const duplicate = await tx.upiReconciliation.findUnique({
        where: { utrHash },
      });
      const outgoing = await tx.upiManualRefund.findUnique({
        where: { outgoingUtrHash: utrHash },
      });
      if (duplicate || outgoing) {
        await tx.upiReconciliation.update({
          where: { id: current.id },
          data: { state: 'NEEDS_REVIEW' },
        });
        await this.audit(tx, userId, 'UPI_DUPLICATE_CLAIM', orderId);
        await this.notify(tx, userId, orderId, 'DUPLICATE_TRANSACTION');
        return;
      }
      await tx.upiReconciliation.update({
        where: { id: current.id },
        data: {
          utrHash,
          utrMasked: mask(utr),
          utrEncrypted: encrypt(utr, this.config.key),
          state: 'CLAIM_SUBMITTED',
          claimedAt: new Date(),
        },
      });
      await this.audit(tx, userId, 'UPI_CLAIM_SUBMITTED', orderId);
      await this.notify(tx, userId, orderId, 'CLAIM_SUBMITTED');
    });
    await this.match(orderId);
    return this.detail(userId, orderId);
  }
  async ingest(input: {
    mailboxId: string;
    messageId: string;
    headers: GmailHeader[];
    text: string;
    receivedAt: Date;
  }) {
    const messageKey = {
      mailboxId: input.mailboxId,
      gmailMessageId: input.messageId,
    };
    if (
      (await this.db.upiCreditNotification.findUnique({
        where: { mailboxId_gmailMessageId: messageKey },
      })) ||
      (await this.db.upiCreditDelivery.findUnique({
        where: { mailboxId_gmailMessageId: messageKey },
      }))
    )
      return { duplicate: true };
    const authenticated = authenticatedSender(
      input.headers,
      this.config.list('GMAIL_RECONCILIATION_ALLOWED_SENDERS'),
    );
    const fam =
      this.config.get('GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED') === 'true'
        ? parseFamAppCredit(input.text)
        : null;
    let beneficiary: string | undefined;
    if (
      fam &&
      this.config.get('GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED') === 'true'
    ) {
      const mailbox = await this.db.reconciliationMailbox.findUnique({
        where: { id: input.mailboxId },
      });
      try {
        const bindings = JSON.parse(
          this.config.get('GMAIL_RECONCILIATION_BENEFICIARIES') ?? '{}',
        ) as Record<string, unknown>;
        const value =
          mailbox &&
          this.config
            .list('GMAIL_RECONCILIATION_ALLOWED_MAILBOXES')
            .includes(mailbox.email.toLowerCase())
            ? bindings[mailbox.email.toLowerCase()]
            : undefined;
        if (
          typeof value === 'string' &&
          /^[\w.-]{2,100}@fam$/.test(value.toLowerCase())
        )
          beneficiary = value.toLowerCase();
      } catch {
        /* Unverified mapping cannot create a candidate. */
      }
    }
    const parsed =
      (this.config.synthetic ? parseSyntheticCredit(input.text) : null) ??
      (fam && beneficiary ? { ...fam, beneficiary } : null);
    const reference = parsed?.utr ?? fam?.utr;
    const utrHash = reference
      ? fingerprint(`utr:${reference}`, this.config.key)
      : null;
    const transactionHash =
      fam && authenticated && beneficiary
        ? fingerprint(`famapp:${fam.transactionId}`, this.config.key)
        : null;
    let orderId: string | undefined,
      duplicate = false;
    await this.serial(async (tx) => {
      if (
        (await tx.upiCreditDelivery.findUnique({
          where: { mailboxId_gmailMessageId: messageKey },
        })) ||
        (await tx.upiCreditNotification.findUnique({
          where: { mailboxId_gmailMessageId: messageKey },
        }))
      ) {
        duplicate = true;
        return;
      }
      const priorFam = transactionHash
        ? await tx.upiCreditNotification.findFirst({
            where: {
              OR: [
                { providerTransactionHash: transactionHash },
                {
                  utrHash,
                  template: 'famapp-credit-v1',
                  providerTransactionHash: { not: null },
                },
              ],
            },
          })
        : null;
      if (priorFam) {
        duplicate = true;
        const compatible =
          priorFam.providerTransactionHash === transactionHash &&
          priorFam.utrHash === utrHash &&
          priorFam.amountMinor === fam!.amountMinor &&
          priorFam.beneficiary === beneficiary &&
          priorFam.transactionAt?.getTime() === fam!.transactionAt.getTime();
        await tx.upiCreditDelivery.create({
          data: {
            ...messageKey,
            notificationId: priorFam.id,
            disposition: compatible ? 'DUPLICATE' : 'CONFLICTING_REFERENCE',
            receivedAt: input.receivedAt,
          },
        });
        if (!compatible)
          await tx.upiCreditNotification.update({
            where: { id: priorFam.id },
            data: { disposition: 'NEEDS_REVIEW' },
          });
        orderId = (
          await tx.upiReconciliation.findUnique({
            where: { utrHash: priorFam.utrHash! },
          })
        )?.orderId;
        await this.audit(
          tx,
          undefined,
          'UPI_ALERT_DUPLICATE',
          orderId ?? 'unmatched',
          {
            mailboxId: input.mailboxId,
            conflict: !compatible,
            notificationId: priorFam.id,
          },
        );
        return;
      }
      const previous = utrHash
        ? await tx.upiCreditNotification.findFirst({
            where: {
              utrHash,
              authentication: 'PASS',
              disposition: {
                in: [
                  'UNMATCHED',
                  'CANDIDATE',
                  'NEEDS_REVIEW',
                  'DUPLICATE_REFERENCE',
                ],
              },
            },
          })
        : null;
      const disposition = !authenticated
        ? 'UNTRUSTED'
        : fam && !beneficiary
          ? 'BENEFICIARY_UNVERIFIED'
          : !parsed
            ? 'UNSUPPORTED'
            : previous
              ? 'DUPLICATE_REFERENCE'
              : 'UNMATCHED';
      const record = await tx.upiCreditNotification.create({
        data: {
          ...messageKey,
          contentHash: createHash('sha256').update(input.text).digest('hex'),
          receivedAt: input.receivedAt,
          authentication: authenticated ? 'PASS' : 'FAIL',
          senderMasked: (
            input.headers.find((h) => h.name.toLowerCase() === 'from')?.value ??
            ''
          )
            .replace(/[^\s<>@]+@([^\s<>]+)/g, '[masked]@$1')
            .slice(0, 200),
          disposition,
          template: fam ? 'famapp-credit-v1' : parsed ? 'synthetic-v1' : null,
          amountMinor: parsed?.amountMinor ?? fam?.amountMinor,
          utrHash,
          utrMasked: reference ? mask(reference) : null,
          beneficiary: parsed?.beneficiary,
          direction: parsed?.direction ?? fam?.direction,
          transactionStatus: parsed?.status ?? fam?.status,
          transactionAt: parsed?.transactionAt ?? fam?.transactionAt,
          providerTransactionHash: transactionHash,
          providerTransactionMasked: fam ? mask(fam.transactionId) : null,
          providerTransactionEncrypted: fam
            ? encrypt(fam.transactionId, this.config.key)
            : null,
          senderDisplayMasked: fam?.senderDisplayMasked,
          balanceMinor: fam?.balanceMinor,
        },
      });
      await tx.upiCreditDelivery.create({
        data: {
          ...messageKey,
          notificationId: record.id,
          disposition: 'IMPORTED',
          receivedAt: input.receivedAt,
        },
      });
      orderId = utrHash
        ? (await tx.upiReconciliation.findUnique({ where: { utrHash } }))
            ?.orderId
        : undefined;
      await this.audit(
        tx,
        undefined,
        'UPI_ALERT_INGESTED',
        orderId ?? 'unmatched',
        {
          mailboxId: input.mailboxId,
          authentication: authenticated ? 'PASS' : 'FAIL',
          template: record.template,
          disposition,
        },
      );
    });
    if (orderId) await this.match(orderId);
    return { duplicate };
  }
  async match(orderId: string) {
    await this.serial(async (tx) => {
      const record = await tx.upiReconciliation.findUnique({
        where: { orderId },
        include: { order: true },
      });
      if (
        !record?.utrHash ||
        ![
          'CLAIM_SUBMITTED',
          'AWAITING_CREDIT_VERIFICATION',
          'NEEDS_REVIEW',
        ].includes(record.state)
      )
        return;
      const alerts = await tx.upiCreditNotification.findMany({
        where: {
          utrHash: record.utrHash,
          authentication: 'PASS',
          disposition: {
            in: [
              'UNMATCHED',
              'CANDIDATE',
              'NEEDS_REVIEW',
              'DUPLICATE_REFERENCE',
            ],
          },
        },
      });
      if (!alerts.length) return;
      const eligible =
        alerts.length === 1 &&
        alerts.every(
          (a) =>
            a.disposition !== 'NEEDS_REVIEW' &&
            a.amountMinor === record.order.amountMinor &&
            a.beneficiary === record.beneficiary &&
            a.direction === 'CREDIT' &&
            a.transactionStatus === 'SUCCESS' &&
            a.transactionAt &&
            timestampMatches(
              a.transactionAt,
              record.order.createdAt,
              record.order.expiresAt,
            ),
        );
      const state = eligible ? 'AWAITING_CREDIT_VERIFICATION' : 'NEEDS_REVIEW';
      await tx.upiCreditNotification.updateMany({
        where: { id: { in: alerts.map((a) => a.id) } },
        data: {
          caseId: record.id,
          disposition: eligible ? 'CANDIDATE' : 'NEEDS_REVIEW',
        },
      });
      if (record.state !== state) {
        if (eligible) {
          await tx.upiReconciliation.update({
            where: { id: record.id },
            data: { state: 'ALERT_MATCHED' },
          });
          await this.audit(tx, undefined, 'UPI_ALERT_MATCHED', orderId);
        }
        await tx.upiReconciliation.update({
          where: { id: record.id },
          data: { state },
        });
        await this.audit(tx, undefined, 'UPI_ALERT_REVIEW', orderId, { state });
        await this.notify(tx, record.order.userId, orderId, state);
      }
      // Intentionally no PaymentOrder CAPTURED or enrollment transition here.
    });
  }
  async verify(
    actorId: string,
    orderId: string,
    dto: UpiCreditVerificationDto,
  ) {
    await this.payments.master(actorId);
    if (
      !dto.independentlyChecked ||
      dto.evidenceType !== 'RECEIVING_ACCOUNT_STATEMENT' ||
      dto.decision !== 'VERIFY' ||
      dto.reason.trim().length < 10
    )
      throw new BadRequestException(
        'Independent statement evidence and an audit reason are required.',
      );
    const utr = normalizeUtr(dto.utr),
      evidence = dto.evidenceReference.trim().toUpperCase();
    if (evidence.length < 6)
      throw new BadRequestException(
        'An independent statement reference is required.',
      );
    await this.serial(async (tx) => {
      const record = await tx.upiReconciliation.findUniqueOrThrow({
        where: { orderId },
        include: {
          order: {
            include: {
              user: true,
              enrollment: true,
              coveredEnrollments: {
                include: { enrollment: { include: { user: true } } },
              },
            },
          },
        },
      });
      if (
        record.order.userId === actorId ||
        record.order.coveredEnrollments.some(
          (c) => c.enrollment.userId === actorId,
        )
      )
        throw new ForbiddenException(
          'A reviewer cannot verify their own payment.',
        );
      this.config.ensure(record.order.provider, record.order.user.email);
      const hash = fingerprint(`credit:${evidence}`, this.config.key);
      if (record.state === 'VERIFIED' && record.creditReferenceHash === hash)
        return;
      if (
        ![
          'CLAIM_SUBMITTED',
          'AWAITING_CREDIT_VERIFICATION',
          'NEEDS_REVIEW',
        ].includes(record.state) ||
        !record.utrHash
      )
        throw new ConflictException('A unique submitted claim is required.');
      const creditedAt = new Date(dto.creditedAt);
      if (
        fingerprint(`utr:${utr}`, this.config.key) !== record.utrHash ||
        dto.amountMinor !== record.order.amountMinor ||
        dto.beneficiary.toLowerCase() !== record.beneficiary ||
        !timestampMatches(
          creditedAt,
          record.order.createdAt,
          record.order.expiresAt,
        )
      )
        throw new ConflictException(
          'Receiving-account credit does not match this order.',
        );
      if (
        !record.order.user.emailVerified ||
        record.order.user.accountStatus !== 'ACTIVE' ||
        !['PARTICIPANT', 'TEAM_LEADER'].includes(record.order.user.role) ||
        record.order.enrollment.status !== 'PENDING'
      )
        throw new ConflictException(
          'Enrollment requires organizer review before confirmation.',
        );
      const covered = record.order.coveredEnrollments.map((c) => c.enrollment);
      if (
        covered.some(
          (e) =>
            e.status !== 'PENDING' ||
            !e.user.emailVerified ||
            e.user.accountStatus !== 'ACTIVE' ||
            !['PARTICIPANT', 'TEAM_LEADER'].includes(e.user.role),
        )
      )
        throw new ConflictException(
          'Every covered enrollment needs organizer review before confirmation.',
        );
      const enrollmentIds = covered.length
        ? covered.map((e) => e.id)
        : [record.order.enrollmentId];
      const now = new Date();
      await tx.upiReconciliation.update({
        where: { id: record.id },
        data: {
          state: 'VERIFIED',
          creditReferenceHash: hash,
          creditReferenceMasked: mask(evidence),
          creditEvidenceEncrypted: encrypt(
            JSON.stringify({
              evidenceType: dto.evidenceType,
              evidenceReference: evidence,
              utr,
              creditedAt: dto.creditedAt,
              amountMinor: dto.amountMinor,
              beneficiary: dto.beneficiary,
            }),
            this.config.key,
          ),
          creditedAt,
          reviewerId: actorId,
          reviewedAt: now,
          verifiedAt: now,
          reviewReason: scrub(dto.reason),
        },
      });
      await tx.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'CAPTURED' },
      });
      await tx.paymentTransaction.create({
        data: {
          paymentOrderId: orderId,
          providerPaymentId: `upi:${record.id}`,
          method: 'UPI_MANUAL_STATEMENT',
          status: 'CAPTURED',
          amountMinor: record.order.amountMinor,
          currency: record.order.currency,
          capturedAt: creditedAt,
        },
      });
      await tx.eventEnrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { status: 'CONFIRMED', confirmationStatus: 'PAYMENT_VERIFIED' },
      });
      await this.audit(
        tx,
        actorId,
        'UPI_CREDIT_INDEPENDENTLY_VERIFIED',
        orderId,
        {
          reason: scrub(dto.reason),
          evidenceType: dto.evidenceType,
          evidenceMasked: mask(evidence),
          amountMinor: record.order.amountMinor,
          environment: record.order.environment,
        },
      );
      for (const target of covered.length ? covered : [record.order.enrollment])
        await this.notify(tx, target.userId, orderId, 'VERIFIED');
    });
    return { reviewed: true };
  }
  async reject(actorId: string, orderId: string, reason: string) {
    await this.payments.master(actorId);
    if (reason.trim().length < 10)
      throw new BadRequestException('An audit reason is required.');
    await this.serial(async (tx) => {
      const record = await tx.upiReconciliation.findUniqueOrThrow({
        where: { orderId },
        include: { order: true },
      });
      if (
        ![
          'CLAIM_SUBMITTED',
          'AWAITING_CREDIT_VERIFICATION',
          'NEEDS_REVIEW',
        ].includes(record.state)
      )
        throw new ConflictException('Only unresolved claims can be rejected.');
      await tx.upiReconciliation.update({
        where: { id: record.id },
        data: {
          state: 'REJECTED',
          reviewerId: actorId,
          reviewedAt: new Date(),
          reviewReason: scrub(reason),
        },
      });
      await this.audit(tx, actorId, 'UPI_CLAIM_REJECTED', orderId, {
        reason: scrub(reason),
      });
      await this.notify(tx, record.order.userId, orderId, 'REJECTED');
    });
    return { reviewed: true };
  }
  async requestRefund(
    actorId: string,
    orderId: string,
    reason: string,
    confirm: boolean,
  ) {
    await this.payments.master(actorId);
    if (!confirm || reason.trim().length < 10)
      throw new BadRequestException('Confirm the refund with an audit reason.');
    return this.serial(async (tx) => {
      const record = await tx.upiReconciliation.findUniqueOrThrow({
        where: { orderId },
        include: {
          order: {
            include: { coveredEnrollments: { include: { enrollment: true } } },
          },
          refund: true,
        },
      });
      if (record.refund)
        return {
          id: record.refund.id,
          status: record.refund.status,
          duplicate: true,
        };
      if (record.state !== 'VERIFIED' || record.order.status !== 'CAPTURED')
        throw new ConflictException(
          'Only independently verified credits can be refunded.',
        );
      const refund = await tx.upiManualRefund.create({
        data: {
          caseId: record.id,
          amountMinor: record.order.amountMinor,
          reason: scrub(reason),
          requestedBy: actorId,
        },
      });
      await tx.upiReconciliation.update({
        where: { id: record.id },
        data: { state: 'REFUND_PENDING' },
      });
      await tx.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'REFUND_PENDING' },
      });
      await this.audit(tx, actorId, 'UPI_REFUND_REQUESTED', orderId, {
        refundId: refund.id,
        reason: scrub(reason),
      });
      await this.notify(tx, record.order.userId, orderId, 'REFUND_PENDING');
      return { id: refund.id, status: refund.status };
    });
  }
  async completeRefund(
    actorId: string,
    orderId: string,
    dto: UpiRefundCompleteDto,
  ) {
    await this.payments.master(actorId);
    if (
      !dto.confirm ||
      !dto.independentlyChecked ||
      dto.direction !== 'DEBIT' ||
      dto.reason.trim().length < 10
    )
      throw new BadRequestException(
        'Independent outgoing-account evidence is required.',
      );
    const evidence = dto.evidenceReference.trim().toUpperCase(),
      utr = normalizeUtr(dto.utr);
    if (evidence.length < 6)
      throw new BadRequestException(
        'An independent outgoing transfer reference is required.',
      );
    await this.serial(async (tx) => {
      const record = await tx.upiReconciliation.findUniqueOrThrow({
        where: { orderId },
        include: {
          order: {
            include: { coveredEnrollments: { include: { enrollment: true } } },
          },
          refund: true,
        },
      });
      const refund = record.refund;
      if (!refund) throw new ConflictException('Request a refund first.');
      if (
        record.order.userId === actorId ||
        record.order.coveredEnrollments.some(
          (c) => c.enrollment.userId === actorId,
        )
      )
        throw new ForbiddenException(
          'A reviewer cannot reconcile their own refund.',
        );
      const hash = fingerprint(`refund:${evidence}`, this.config.key),
        outgoingUtrHash = fingerprint(`utr:${utr}`, this.config.key),
        completedAt = new Date(dto.completedAt);
      if (
        refund.status === 'COMPLETED' &&
        refund.evidenceHash === hash &&
        refund.outgoingUtrHash === outgoingUtrHash
      )
        return;
      if (
        record.state !== 'REFUND_PENDING' ||
        refund.status !== 'PENDING' ||
        dto.amountMinor !== refund.amountMinor ||
        completedAt > new Date() ||
        completedAt < refund.requestedAt
      )
        throw new ConflictException(
          'Refund evidence does not match the pending full refund.',
        );
      if (
        await tx.upiReconciliation.findUnique({
          where: { utrHash: outgoingUtrHash },
        })
      )
        throw new ConflictException(
          'An incoming credit UTR cannot identify an outgoing refund.',
        );
      await tx.upiManualRefund.update({
        where: { id: refund.id },
        data: {
          status: 'COMPLETED',
          completedBy: actorId,
          completedAt,
          evidenceHash: hash,
          outgoingUtrHash,
          evidenceMasked: mask(evidence),
          evidenceEncrypted: encrypt(
            JSON.stringify({
              evidence,
              utr,
              completedAt,
              reason: scrub(dto.reason),
            }),
            this.config.key,
          ),
        },
      });
      await tx.upiReconciliation.update({
        where: { id: record.id },
        data: { state: 'REFUNDED' },
      });
      await tx.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });
      await tx.eventEnrollment.updateMany({
        where: {
          id: {
            in: record.order.coveredEnrollments.length
              ? record.order.coveredEnrollments.map((c) => c.enrollmentId)
              : [record.order.enrollmentId],
          },
          status: 'CONFIRMED',
        },
        data: { status: 'WITHDRAWN', confirmationStatus: 'REFUNDED' },
      });
      await this.audit(tx, actorId, 'UPI_REFUND_COMPLETED', orderId, {
        reason: scrub(dto.reason),
        evidenceMasked: mask(evidence),
        amountMinor: refund.amountMinor,
      });
      for (const target of record.order.coveredEnrollments.length
        ? record.order.coveredEnrollments.map((c) => c.enrollment)
        : [{ userId: record.order.userId }])
        await this.notify(tx, target.userId, orderId, 'REFUNDED');
    });
    return { reviewed: true };
  }
  async queue(actorId: string, utr?: string) {
    await this.payments.master(actorId);
    const hash = utr
      ? fingerprint(`utr:${normalizeUtr(utr)}`, this.config.key)
      : undefined;
    const [cases, notifications, history] = await Promise.all([
      this.db.upiReconciliation.findMany({
        where: { utrHash: hash },
        select: {
          ...safeCase,
          reviewReason: true,
          order: {
            select: {
              id: true,
              provider: true,
              amountMinor: true,
              environment: true,
              teamNameSnapshot: true,
              billingTeamId: true,
              coveredEnrollments: {
                select: {
                  enrollmentId: true,
                  enrollment: { select: { registrationId: true } },
                },
              },
              enrollment: { select: { registrationId: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      this.db.upiCreditNotification.findMany({
        where: { utrHash: hash },
        select: {
          id: true,
          disposition: true,
          authentication: true,
          amountMinor: true,
          utrMasked: true,
          direction: true,
          transactionStatus: true,
          transactionAt: true,
          receivedAt: true,
          caseId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.db.auditLog.findMany({
        where: { resource: 'upi' },
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          userId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);
    const [verified, refunded] = await Promise.all([
      this.db.paymentOrder.aggregate({
        where: {
          provider: { in: ['MANUAL_UPI', 'FAMAPP_SANDBOX'] },
          upiCase: { verifiedAt: { not: null } },
        },
        _sum: { amountMinor: true },
      }),
      this.db.upiManualRefund.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountMinor: true },
      }),
    ]);
    return {
      flags: this.config.status(),
      cases,
      notifications,
      history,
      totals: {
        verifiedMinor: verified._sum.amountMinor ?? 0,
        refundedMinor: refunded._sum.amountMinor ?? 0,
      },
      limit: 200,
    };
  }
  async expire() {
    await this.serial(async (tx) => {
      const records = await tx.upiReconciliation.findMany({
        where: { state: 'PENDING', order: { expiresAt: { lt: new Date() } } },
        include: { order: true },
        take: 50,
      });
      for (const record of records) {
        await tx.upiReconciliation.update({
          where: { id: record.id },
          data: { state: 'EXPIRED' },
        });
        await tx.paymentOrder.update({
          where: { id: record.orderId },
          data: { status: 'EXPIRED' },
        });
        await this.audit(tx, undefined, 'UPI_ORDER_EXPIRED', record.orderId);
      }
    });
  }
  async reconcilePending() {
    const pending = await this.db.upiReconciliation.findMany({
      where: {
        state: {
          in: [
            'CLAIM_SUBMITTED',
            'AWAITING_CREDIT_VERIFICATION',
            'NEEDS_REVIEW',
          ],
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: 50,
    });
    for (const record of pending) {
      await this.match(record.orderId);
      await this.db.upiReconciliation.updateMany({
        where: { id: record.id },
        data: { updatedAt: new Date() },
      });
    }
  }
  async exportPage(
    actorId: string,
    kind: 'AUDIT' | 'PAYMENTS',
    cursor?: string,
    cutoff?: string,
  ) {
    await this.payments.master(actorId);
    const before = cutoff ? new Date(cutoff) : new Date();
    if (before > new Date() || !Number.isFinite(before.getTime()))
      throw new BadRequestException('Invalid export cutoff.');
    const paging = {
      take: 500,
      orderBy: { id: 'asc' as const },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    };
    const records =
      kind === 'AUDIT'
        ? await this.db.auditLog.findMany({
            ...paging,
            where: { resource: 'upi', createdAt: { lte: before } },
            select: {
              id: true,
              action: true,
              userId: true,
              metadata: true,
              createdAt: true,
            },
          })
        : await this.db.upiReconciliation.findMany({
            ...paging,
            where: { createdAt: { lte: before } },
            select: {
              ...safeCase,
              order: {
                select: {
                  amountMinor: true,
                  currency: true,
                  provider: true,
                  environment: true,
                  eventId: true,
                  teamId: true,
                  teamNameSnapshot: true,
                  billingTeamId: true,
                  coveredEnrollments: {
                    select: {
                      enrollmentId: true,
                      enrollment: { select: { registrationId: true } },
                    },
                  },
                  enrollment: { select: { registrationId: true } },
                },
              },
            },
          });
    return {
      records,
      cutoff: before.toISOString(),
      nextCursor:
        records.length === 500 ? records[records.length - 1].id : null,
    };
  }
}
