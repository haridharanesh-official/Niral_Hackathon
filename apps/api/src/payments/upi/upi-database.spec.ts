import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { PaymentsService } from '../payments.service';
import { UpiConfig } from './upi-config';
import { UpiService } from './upi.service';
import { GmailReconciliationService } from './gmail-reconciliation.service';
import { TeamsService } from '../../teams/teams.service';
import { AuditService } from '../../audit/audit.service';

const databaseUrl = process.env.NIRAL_TEST_DATABASE_URL;
(databaseUrl ? describe : describe.skip)(
  'Custom UPI with isolated PostgreSQL (SYNTHETIC credits; no money or Gmail account accessed)',
  () => {
    let db: PrismaClient,
      payments: PaymentsService,
      upi: UpiService,
      gmail: GmailReconciliationService,
      config: ConfigService;
    const marker = `upi-${randomUUID()}`,
      eventId = `${marker}-event`,
      master = `${marker}-master`,
      users: string[] = [];
    let counter = 0;
    const utr = () => String(800000000000 + counter++);
    const headers = [
      { name: 'From', value: 'alerts@example.test' },
      {
        name: 'Authentication-Results',
        value:
          'mx.google.com; spf=pass; dkim=pass header.i=@example.test; dmarc=pass header.from=example.test',
      },
    ];
    function body(
      ref: string,
      amount = '1.00',
      beneficiary = 'niral-test@upi',
      at = new Date().toISOString(),
    ) {
      return `NIRAL SYNTHETIC CREDIT V1\nAmount: ${amount}\nUTR: ${ref}\nBeneficiary: ${beneficiary}\nDirection: CREDIT\nStatus: SUCCESS\nTimestamp: ${at}`;
    }
    async function fixture() {
      const userId = `${marker}-${counter++}`;
      users.push(userId);
      await db.user.create({
        data: {
          id: userId,
          email: `${userId}@example.test`,
          name: 'SYNTHETIC UPI STUDENT',
          role: 'PARTICIPANT',
          accountStatus: 'ACTIVE',
          emailVerified: new Date(),
        },
      });
      config.set(
        'UPI_TEST_PARTICIPANT_EMAILS',
        users.map((id) => `${id}@example.test`).join(','),
      );
      const enrollment = await db.eventEnrollment.create({
        data: {
          userId,
          eventId,
          registrationId: `${userId}-reg`,
          status: 'PENDING',
          confirmationStatus: 'PAYMENT_PENDING',
          paymentModeSnapshot: 'PAID',
          paymentProviderSnapshot: 'MANUAL_UPI',
          feeAmountSnapshot: 100,
          feeCurrencySnapshot: 'INR',
          paymentPolicySnapshot: {
            eventName: 'SYNTHETIC UPI TEST',
            receiptIssuer: 'SYNTHETIC ISSUER',
          },
        },
      });
      const order = await upi.create(userId, enrollment.id);
      return { userId, enrollment, order };
    }
    async function alert(
      ref: string,
      amount?: string,
      beneficiary?: string,
      customHeaders = headers,
      at?: string,
    ) {
      return upi.ingest({
        mailboxId: marker,
        messageId: `${marker}-${counter++}`,
        headers: customHeaders,
        text: body(ref, amount, beneficiary, at),
        receivedAt: new Date(),
      });
    }
    function evidence(ref: string, extra = '') {
      return {
        decision: 'VERIFY' as const,
        reason: 'Synthetic statement independently checked',
        evidenceType: 'RECEIVING_ACCOUNT_STATEMENT',
        evidenceReference: `${marker}-statement-${ref}${extra}`,
        utr: ref,
        beneficiary: 'niral-test@upi',
        amountMinor: 100,
        creditedAt: new Date().toISOString(),
        independentlyChecked: true,
      };
    }
    beforeAll(async () => {
      const url = new URL(databaseUrl!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.pathname.endsWith('_test')
      )
        throw Error('Dedicated localhost *_test database required.');
      db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      await db.$connect();
      await db.user.create({
        data: {
          id: master,
          email: `${master}@example.test`,
          name: 'TEST FINANCE',
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          emailVerified: new Date(),
        },
      });
      await db.event.create({
        data: {
          id: eventId,
          slug: eventId,
          name: 'ISOLATED SYNTHETIC UPI TEST',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 172800000),
          isActive: true,
          isPublished: true,
          status: 'REGISTRATION_OPEN',
          registrationEnabled: true,
          registrationPaymentMode: 'PAID',
          paymentProvider: 'MANUAL_UPI',
          feeAmountMinor: 100,
          feeApprovedAt: new Date(),
          receiptIssuer: 'TEST',
          paymentPolicyUrl: 'https://example.test/terms',
          refundPolicyUrl: 'https://example.test/refunds',
          cancellationPolicyUrl: 'https://example.test/cancellation',
        },
      });
      config = new ConfigService({
        NODE_ENV: 'development',
        UPI_SYNTHETIC_MODE: 'true',
        MANUAL_UPI_ENABLED: 'true',
        MANUAL_UPI_TEST_ID: 'niral-test@upi',
        UPI_RECONCILIATION_KEY: randomBytes(32).toString('base64'),
        GMAIL_RECONCILIATION_ALLOWED_SENDERS: 'alerts@example.test',
      });
      const upiConfig = new UpiConfig(config);
      payments = new PaymentsService(db as PrismaService, upiConfig, {
        send: jest.fn().mockResolvedValue({ success: false }),
      } as unknown as MailService);
      upi = new UpiService(db as PrismaService, payments, upiConfig);
      gmail = new GmailReconciliationService(
        db as PrismaService,
        payments,
        upiConfig,
        upi,
      );
    });
    afterAll(async () => {
      if (!db) return;
      const orderIds = (
        await db.paymentOrder.findMany({
          where: { eventId },
          select: { id: true },
        })
      ).map((o) => o.id);
      const mailboxIds = [
        marker,
        ...(
          await db.reconciliationMailbox.findMany({
            where: { email: `${marker}@example.test` },
            select: { id: true },
          })
        ).map((m) => m.id),
      ];
      await db.upiCreditDelivery.deleteMany({
        where: { mailboxId: { in: mailboxIds } },
      });
      await db.upiCreditNotification.deleteMany({
        where: { mailboxId: { in: mailboxIds } },
      });
      await db.upiManualRefund.deleteMany({
        where: { reconciliation: { order: { eventId } } },
      });
      await db.upiReconciliation.deleteMany({ where: { order: { eventId } } });
      await db.paymentRefund.deleteMany({
        where: { paymentTransaction: { paymentOrder: { eventId } } },
      });
      await db.paymentTransaction.deleteMany({
        where: { paymentOrder: { eventId } },
      });
      await db.paymentCoverage.deleteMany({ where: { order: { eventId } } });
      await db.paymentOrder.deleteMany({ where: { eventId } });
      await db.team.deleteMany({ where: { eventId } });
      await db.paymentNotification.deleteMany({
        where: { userId: { in: users } },
      });
      await db.eventEnrollment.deleteMany({ where: { eventId } });
      await db.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: [...users, master] } },
            {
              resource: 'upi',
              metadata: { path: ['mailboxId'], equals: marker },
            },
            ...orderIds.map((id) => ({
              resource: 'upi',
              metadata: { path: ['orderId'], equals: id },
            })),
          ],
        },
      });
      await db.event.delete({ where: { id: eventId } });
      await db.reconciliationOAuthState.deleteMany({
        where: { actorId: master },
      });
      await db.reconciliationMailbox.deleteMany({
        where: { email: `${marker}@example.test` },
      });
      await db.user.deleteMany({ where: { id: { in: [...users, master] } } });
      await db.$disconnect();
    });
    it('creates one immutable order with server price and a local QR', async () => {
      const f = await fixture();
      expect(f.order.amountMinor).toBe(100);
      expect(new URL(f.order.checkout!.upiUri).searchParams.get('am')).toBe(
        '1.00',
      );
      expect(new URL(f.order.checkout!.upiUri).searchParams.get('tr')).toBe(
        f.order.id,
      );
      expect(f.order.checkout?.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect((await upi.create(f.userId, f.enrollment.id)).id).toBe(f.order.id);
      expect(
        await db.paymentOrder.count({
          where: { enrollmentId: f.enrollment.id },
        }),
      ).toBe(1);
    });
    it('blocks wrong ownership and unauthorized financial verification', async () => {
      const f = await fixture(),
        other = await fixture();
      await expect(upi.claim(other.userId, f.order.id, utr())).rejects.toThrow(
        'not found',
      );
      await expect(
        upi.verify(f.userId, f.order.id, evidence(utr())),
      ).rejects.toThrow('Master');
    });
    it('keeps a submitted UTR and matched Gmail alert unconfirmed', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await alert(ref);
      const detail = await upi.detail(f.userId, f.order.id);
      expect(detail.upiCase?.state).toBe('AWAITING_CREDIT_VERIFICATION');
      expect(detail.enrollment.status).toBe('PENDING');
      expect(detail.status).toBe('PENDING');
      expect(JSON.stringify(detail)).not.toContain(ref);
      await expect(payments.receipt(f.order.id, f.userId)).rejects.toThrow(
        'only',
      );
    });
    it('matches an alert arriving before the claim, including delayed delivery', async () => {
      const f = await fixture(),
        ref = utr();
      await alert(ref, undefined, undefined, headers, new Date().toISOString());
      await upi.claim(f.userId, f.order.id, ref);
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'AWAITING_CREDIT_VERIFICATION',
      );
    });
    it.each([
      ['2.00', 'niral-test@upi'],
      ['1.00', 'wrong@upi'],
    ])('routes mismatch %s %s to review', async (amount, beneficiary) => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await alert(ref, amount, beneficiary);
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'NEEDS_REVIEW',
      );
    });
    it('rejects spoofed authentication and unsupported real-world templates', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await alert(ref, undefined, undefined, [
        { name: 'From', value: 'alerts@example.test' },
      ]);
      await upi.ingest({
        mailboxId: marker,
        messageId: `${marker}-${counter++}`,
        headers,
        text: 'Unvalidated real-world bank email',
        receivedAt: new Date(),
      });
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'CLAIM_SUBMITTED',
      );
      expect(
        await db.upiCreditNotification.count({
          where: { mailboxId: marker, disposition: 'UNSUPPORTED' },
        }),
      ).toBe(1);
    });
    it('deduplicates replayed Gmail message IDs and flags repeated UTR notifications', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      const input = {
        mailboxId: marker,
        messageId: `${marker}-${counter++}`,
        headers,
        text: body(ref),
        receivedAt: new Date(),
      };
      await upi.ingest(input);
      expect((await upi.ingest(input)).duplicate).toBe(true);
      await alert(ref);
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'NEEDS_REVIEW',
      );
    });
    it('prevents concurrent duplicate UTR allocation', async () => {
      const a = await fixture(),
        b = await fixture(),
        ref = utr();
      await Promise.allSettled([
        upi.claim(a.userId, a.order.id, ref),
        upi.claim(b.userId, b.order.id, ref),
      ]);
      const records = await db.upiReconciliation.findMany({
        where: { orderId: { in: [a.order.id, b.order.id] } },
      });
      expect(records.filter((r) => r.utrHash)).toHaveLength(1);
      expect(records.every((r) => r.state !== 'VERIFIED')).toBe(true);
    });
    it('is idempotent for simultaneous claims on the same order', async () => {
      const f = await fixture(),
        ref = utr();
      await Promise.all([
        upi.claim(f.userId, f.order.id, ref),
        upi.claim(f.userId, f.order.id, ref),
      ]);
      expect(
        await db.auditLog.count({
          where: { action: 'UPI_CLAIM_SUBMITTED', userId: f.userId },
        }),
      ).toBe(1);
    });
    it('rejects mismatched statement evidence and never trusts email-only approval', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await expect(
        upi.verify(master, f.order.id, { ...evidence(ref), amountMinor: 101 }),
      ).rejects.toThrow('does not match');
      await expect(
        upi.verify(master, f.order.id, {
          ...evidence(ref),
          evidenceReference: '      ',
        }),
      ).rejects.toThrow('reference is required');
      await expect(
        upi.verify(master, f.order.id, {
          ...evidence(ref),
          independentlyChecked: false,
        }),
      ).rejects.toThrow('Independent');
      expect((await upi.detail(f.userId, f.order.id)).enrollment.status).toBe(
        'PENDING',
      );
    });
    it('uses actual statement review even without an email and confirms enrollment atomically', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      const proof = evidence(ref);
      await Promise.all([
        upi.verify(master, f.order.id, proof),
        upi.verify(master, f.order.id, proof),
      ]);
      const detail = await upi.detail(f.userId, f.order.id);
      expect(detail.upiCase?.state).toBe('VERIFIED');
      expect(detail.enrollment.status).toBe('CONFIRMED');
      expect(
        await db.paymentTransaction.count({
          where: { paymentOrderId: f.order.id },
        }),
      ).toBe(1);
      expect(
        await db.paymentNotification.count({
          where: { userId: f.userId, eventType: 'payment.upi.verified' },
        }),
      ).toBe(1);
      expect(await payments.receipt(f.order.id, f.userId)).toContain(
        'payment acknowledgement',
      );
      await alert(ref);
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'VERIFIED',
      );
    });
    it('rolls back all confirmation writes on a database uniqueness failure', async () => {
      const f = await fixture(),
        other = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await db.paymentTransaction.create({
        data: {
          paymentOrderId: other.order.id,
          providerPaymentId: `upi:${f.order.upiCase!.id}`,
          status: 'PENDING',
          amountMinor: 100,
          currency: 'INR',
        },
      });
      await expect(
        upi.verify(master, f.order.id, evidence(ref)),
      ).rejects.toThrow('already allocated');
      const detail = await upi.detail(f.userId, f.order.id);
      expect(detail.upiCase?.state).toBe('CLAIM_SUBMITTED');
      expect(detail.status).toBe('PENDING');
      expect(detail.enrollment.status).toBe('PENDING');
    });
    it('tracks one full refund and completes only with outgoing transfer evidence', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await upi.verify(master, f.order.id, evidence(ref));
      const results = await Promise.all([
        upi.requestRefund(
          master,
          f.order.id,
          'Synthetic refund approved',
          true,
        ),
        upi.requestRefund(
          master,
          f.order.id,
          'Synthetic refund approved',
          true,
        ),
      ]);
      expect(results[0].id).toBe(results[1].id);
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'REFUND_PENDING',
      );
      const proof = {
        reason: 'Synthetic outgoing debit independently checked',
        confirm: true,
        evidenceReference: `${marker}-refund-${ref}`,
        utr: utr(),
        amountMinor: 100,
        completedAt: new Date().toISOString(),
        direction: 'DEBIT',
        independentlyChecked: true,
      };
      await expect(
        upi.completeRefund(master, f.order.id, { ...proof, amountMinor: 99 }),
      ).rejects.toThrow('does not match');
      await upi.completeRefund(master, f.order.id, proof);
      await upi.completeRefund(master, f.order.id, proof);
      const replay = await fixture();
      await upi.claim(replay.userId, replay.order.id, proof.utr);
      expect(
        (await upi.detail(replay.userId, replay.order.id)).upiCase?.state,
      ).toBe('NEEDS_REVIEW');
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'REFUNDED',
      );
      expect((await upi.detail(f.userId, f.order.id)).enrollment.status).toBe(
        'WITHDRAWN',
      );
    });
    it('supports reasoned rejection and expiry without claiming captured credit', async () => {
      const f = await fixture(),
        ref = utr();
      await upi.claim(f.userId, f.order.id, ref);
      await upi.reject(master, f.order.id, 'Synthetic evidence was invalid');
      expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
        'REJECTED',
      );
      const expired = await fixture();
      await db.paymentOrder.update({
        where: { id: expired.order.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      await upi.expire();
      expect(
        (await upi.detail(expired.userId, expired.order.id)).upiCase?.state,
      ).toBe('EXPIRED');
    });
    it('keeps historical financial records readable without provider integration', async () => {
      const f = await fixture();
      await db.paymentOrder.update({
        where: { id: f.order.id },
        data: { provider: 'RAZORPAY', providerOrderId: `order_${counter++}` },
      });
      expect((await payments.mine(f.userId))[0].provider).toBe('RAZORPAY');
      await expect(upi.detail(f.userId, f.order.id)).rejects.toThrow(
        'not found',
      );
    });
    it('fails closed for missing Gmail configuration and invalid OAuth state', async () => {
      await expect(gmail.start(master)).rejects.toThrow('not configured');
      await expect(gmail.start(users[0])).rejects.toThrow('Master');
      config.set('GMAIL_RECONCILIATION_ENABLED', 'true');
      config.set('GMAIL_RECONCILIATION_CLIENT_ID', 'synthetic-client');
      config.set('GMAIL_RECONCILIATION_CLIENT_SECRET', 'synthetic-secret');
      config.set(
        'GMAIL_RECONCILIATION_REDIRECT_URI',
        'http://localhost:3000/admin/payments',
      );
      config.set(
        'GMAIL_RECONCILIATION_ALLOWED_MAILBOXES',
        `${marker}@example.test`,
      );
      config.set('GMAIL_RECONCILIATION_LABEL_ID', 'Label_synthetic');
      await expect(
        gmail.complete(master, 'invalid', '0'.repeat(64)),
      ).rejects.toThrow('state');
      const started = await gmail.start(master);
      expect(new URL(started.authorizationUrl).searchParams.get('scope')).toBe(
        'https://www.googleapis.com/auth/gmail.readonly',
      );
    });
    it('completes only a one-time read-only grant and encrypts OAuth refresh tokens', async () => {
      const started = await gmail.start(master),
        state = new URL(started.authorizationUrl).searchParams.get('state')!;
      const mock = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: 'synthetic-access',
              refresh_token: 'synthetic-refresh',
              scope: 'https://www.googleapis.com/auth/gmail.readonly',
            }),
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ emailAddress: `${marker}@example.test` }),
          ),
        );
      try {
        await gmail.complete(master, 'synthetic-code', state);
        const box = await db.reconciliationMailbox.findUniqueOrThrow({
          where: { email: `${marker}@example.test` },
        });
        expect(box.refreshTokenEncrypted).not.toContain('synthetic-refresh');
        expect(JSON.stringify(await gmail.status(master))).not.toContain(
          'synthetic-refresh',
        );
        await expect(
          gmail.complete(master, 'synthetic-code', state),
        ).rejects.toThrow('state');
      } finally {
        mock.mockRestore();
      }
    });
    it('retains mailbox errors on Gmail connection failure without confirming any payment', async () => {
      const mock = jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('synthetic network outage'));
      try {
        const result = await gmail.poll(master);
        expect(result.failures).toBe(1);
        expect(
          (
            await db.reconciliationMailbox.findUniqueOrThrow({
              where: { email: `${marker}@example.test` },
            })
          ).lastError,
        ).toContain('READ_UNAVAILABLE');
      } finally {
        mock.mockRestore();
      }
    });
    it('exports all masked financial/audit pages without OAuth or evidence secrets', async () => {
      const result = await upi.exportPage(master, 'PAYMENTS');
      expect(result.records.length).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toContain('Encrypted');
      await expect(upi.exportPage(users[0], 'AUDIT')).rejects.toThrow('Master');
    });
    it('refreshes a rotated OAuth token, checks identity/label, and polls one FamApp credit without settling it', async () => {
      const f = await fixture(),
        ref = utr(),
        box = await db.reconciliationMailbox.findUniqueOrThrow({
          where: { email: `${marker}@example.test` },
        });
      config.set('FAMAPP_SANDBOX_ENABLED', 'true');
      config.set('FAMAPP_PERSONAL_TEST_AUTHORIZED', 'true');
      config.set('FAMAPP_TEST_UPI_ID', 'synthetic-test-only@fam');
      config.set('GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED', 'true');
      config.set('GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED', 'true');
      config.set(
        'GMAIL_RECONCILIATION_BENEFICIARIES',
        JSON.stringify({ [box.email]: 'synthetic-test-only@fam' }),
      );
      config.set('GMAIL_RECONCILIATION_ALLOWED_SENDERS', 'no-reply@famapp.in');
      config.set('GMAIL_RECONCILIATION_LABEL_NAME', 'NIRAL Payment Alerts');
      await db.paymentOrder.update({
        where: { id: f.order.id },
        data: {
          provider: 'FAMAPP_SANDBOX',
          createdAt: new Date('2026-10-27T07:00:00Z'),
        },
      });
      await db.upiReconciliation.update({
        where: { orderId: f.order.id },
        data: { beneficiary: 'synthetic-test-only@fam' },
      });
      await upi.claim(f.userId, f.order.id, ref);
      const messageId = `${marker}-fam-credit`,
        transactionId = `FAM_SYNTH_${counter++}`;
      const famBody = `Hey Test Recipient,\nYou have successfully received\n₹1.0\nfrom Test Sender\nTransaction ID : ${transactionId}\nDate : 12:31 PM IST, 27 October 2026\nUpdated Balance : ₹999.0\nUTR : ${ref}\nBest, Fam.`;
      const auth = [
        { name: 'From', value: 'no-reply@famapp.in' },
        {
          name: 'Authentication-Results',
          value:
            'mx.google.com; spf=pass; dkim=pass header.i=@famapp.in; dmarc=pass header.from=famapp.in',
        },
      ];
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation((url) => {
          const path =
            typeof url === 'string'
              ? url
              : url instanceof URL
                ? url.href
                : url.url;
          let result: unknown;
          if (path.includes('oauth2.googleapis.com'))
            result = {
              access_token: 'synthetic-rotated-access',
              refresh_token: 'synthetic-rotated-refresh',
              expires_in: 3600,
              scope: 'https://www.googleapis.com/auth/gmail.readonly',
            };
          else if (path.endsWith('/profile'))
            result = { emailAddress: box.email };
          else if (path.endsWith('/labels/Label_synthetic'))
            result = { id: 'Label_synthetic', name: 'NIRAL Payment Alerts' };
          else if (path.endsWith('/labels'))
            result = {
              labels: [
                { id: 'Label_synthetic', name: 'NIRAL Payment Alerts' },
                { id: 'Private_other_label', name: 'Other' },
              ],
            };
          else if (path.includes('/messages?'))
            result = { messages: [{ id: messageId }] };
          else
            result = {
              internalDate: String(Date.now()),
              payload: {
                mimeType: 'multipart/alternative',
                headers: auth,
                parts: [
                  {
                    mimeType: 'text/plain',
                    body: { data: Buffer.from(famBody).toString('base64url') },
                  },
                  {
                    mimeType: 'text/html',
                    body: {
                      data: Buffer.from(
                        `<table><tr><td>${famBody.replaceAll('\n', '</td></tr><tr><td>')}</td></tr></table>`,
                      ).toString('base64url'),
                    },
                  },
                ],
              },
            };
          return Promise.resolve(new Response(JSON.stringify(result)));
        });
      try {
        expect((await gmail.health(master, box.id)).healthy).toBe(true);
        expect((await gmail.labels(master, box.id)).labels).toHaveLength(1);
        expect((await gmail.poll(master)).imported).toBe(1);
        expect((await gmail.poll(master)).imported).toBe(0);
        expect(
          fetchMock.mock.calls.filter(
            ([url]) =>
              typeof url === 'string' && url.includes('oauth2.googleapis.com'),
          ),
        ).toHaveLength(1);
        fetchMock.mockResolvedValueOnce(
          new Response(JSON.stringify({ error: 'invalid_token' }), {
            status: 401,
          }),
        );
        expect((await gmail.labels(master, box.id)).labels).toHaveLength(1);
        expect(
          fetchMock.mock.calls.filter(
            ([url]) =>
              typeof url === 'string' && url.includes('oauth2.googleapis.com'),
          ),
        ).toHaveLength(2);
        const record = await db.upiCreditNotification.findUniqueOrThrow({
          where: {
            mailboxId_gmailMessageId: {
              mailboxId: box.id,
              gmailMessageId: messageId,
            },
          },
        });
        expect(record.amountMinor).toBe(100);
        expect(record.balanceMinor).toBe(99900);
        expect(record.providerTransactionEncrypted).not.toContain(
          transactionId,
        );
        expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
          'AWAITING_CREDIT_VERIFICATION',
        );
        expect((await upi.detail(f.userId, f.order.id)).enrollment.status).toBe(
          'PENDING',
        );
        await upi.ingest({
          mailboxId: box.id,
          messageId: `${messageId}-repeat`,
          headers: auth,
          text: famBody,
          receivedAt: new Date(),
        });
        expect(
          await db.upiCreditNotification.count({
            where: { providerTransactionHash: record.providerTransactionHash },
          }),
        ).toBe(1);
        expect(
          await db.upiCreditDelivery.count({
            where: { notificationId: record.id },
          }),
        ).toBe(2);
        await upi.ingest({
          mailboxId: box.id,
          messageId: `${messageId}-conflict`,
          headers: auth,
          text: famBody.replace('₹1.0', '₹2.0'),
          receivedAt: new Date(),
        });
        expect((await upi.detail(f.userId, f.order.id)).upiCase?.state).toBe(
          'NEEDS_REVIEW',
        );
        expect(
          (
            await db.reconciliationMailbox.findUniqueOrThrow({
              where: { id: box.id },
            })
          ).refreshTokenEncrypted,
        ).not.toBe(box.refreshTokenEncrypted);
      } finally {
        fetchMock.mockRestore();
        config.set(
          'GMAIL_RECONCILIATION_ALLOWED_SENDERS',
          'alerts@example.test',
        );
      }
    });
    it('requires reconnection after revoked refresh grants and rejects unauthorized health checks', async () => {
      const box = await db.reconciliationMailbox.findUniqueOrThrow({
        where: { email: `${marker}@example.test` },
      });
      await expect(gmail.health(users[0], box.id)).rejects.toThrow('Master');
      const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), {
          status: 400,
        }),
      );
      try {
        const result = await gmail.health(master, box.id);
        expect(result.healthy).toBe(false);
        expect(result.reconnectRequired).toBe(true);
        expect(
          (
            await db.reconciliationMailbox.findUniqueOrThrow({
              where: { id: box.id },
            })
          ).enabled,
        ).toBe(false);
      } finally {
        mock.mockRestore();
      }
    });
    it('preserves order prices across audited fee changes and rejects stale publication', async () => {
      const f = await fixture();
      const current = await db.event.findUniqueOrThrow({
        where: { id: eventId },
      });
      const dto = {
        provider: 'MANUAL_UPI',
        mode: 'PAID' as const,
        amountMinor: 200,
        taxAmountMinor: 0,
        currency: 'INR',
        feeScope: 'TEAM',
        expectedVersion: current.paymentSettingsVersion,
        expectedOldAmountMinor: current.feeAmountMinor!,
        confirmPublish: true,
        feeApproved: true,
        receiptIssuer: 'SYNTHETIC ISSUER',
        paymentPolicyUrl: 'https://example.test/terms',
        refundPolicyUrl: 'https://example.test/refunds',
        cancellationPolicyUrl: 'https://example.test/cancellation',
      };
      await expect(
        payments.updateSettings(master, eventId, {
          ...dto,
          cancellationPolicyUrl: undefined,
        }),
      ).rejects.toThrow('Approved fee');
      await expect(
        payments.updateSettings(master, eventId, {
          ...dto,
          refundPolicyUrl: 'http://example.test/refunds',
        }),
      ).rejects.toThrow('HTTPS');
      await expect(
        payments.updateSettings(master, eventId, {
          ...dto,
          feeApproved: false,
        }),
      ).rejects.toThrow('Approved fee');
      await payments.updateSettings(master, eventId, dto);
      await expect(
        payments.updateSettings(master, eventId, dto),
      ).rejects.toThrow('changed');
      expect((await upi.create(f.userId, f.enrollment.id)).amountMinor).toBe(
        100,
      );
    });
    it('bills one locked team roster once, confirms all covered enrollments and refunds all together', async () => {
      const a = await fixture(),
        b = await fixture();
      const ids = [a.order.id, b.order.id];
      await db.upiReconciliation.deleteMany({
        where: { orderId: { in: ids } },
      });
      await db.paymentOrder.deleteMany({ where: { id: { in: ids } } });
      const policy = {
        eventName: 'SYNTHETIC TEAM TEST',
        receiptIssuer: 'SYNTHETIC ISSUER',
        feeScope: 'TEAM',
        version: 1,
        minTeamSize: 2,
        maxTeamSize: 4,
      };
      await db.eventEnrollment.updateMany({
        where: { id: { in: [a.enrollment.id, b.enrollment.id] } },
        data: { feeScopeSnapshot: 'TEAM', paymentPolicySnapshot: policy },
      });
      const teams = new TeamsService(
        db as PrismaService,
        {
          record: jest.fn().mockResolvedValue(undefined),
        } as unknown as AuditService,
      );
      await teams.create(a.userId, {
        eventId,
        name: `${marker}-team`,
        description: 'Synthetic roster billing test',
        theme: 'AI + IoT',
      });
      const team = await db.team.findFirstOrThrow({
        where: { leaderId: a.userId },
      });
      await teams.join(b.userId, team.inviteCode);
      await expect(upi.create(b.userId, b.enrollment.id)).rejects.toThrow(
        'team leader',
      );
      const order = await upi.create(a.userId, a.enrollment.id);
      expect(order.amountMinor).toBe(100);
      expect(order.coveredEnrollments).toHaveLength(2);
      expect((await upi.create(a.userId, a.enrollment.id)).id).toBe(order.id);
      expect(
        (await payments.mine(b.userId)).some((o) => o.id === order.id),
      ).toBe(true);
      await expect(upi.claim(b.userId, order.id, utr())).rejects.toThrow(
        'authorized payer',
      );
      await expect(teams.leaveTeam(b.userId)).rejects.toThrow('locked');
      await expect(
        db.teamMember.deleteMany({
          where: { teamId: team.id, userId: b.userId },
        }),
      ).rejects.toThrow('locked');
      const ref = utr();
      await upi.claim(a.userId, order.id, ref);
      await upi.verify(master, order.id, evidence(ref));
      expect(
        await db.eventEnrollment.count({
          where: {
            id: { in: [a.enrollment.id, b.enrollment.id] },
            status: 'CONFIRMED',
          },
        }),
      ).toBe(2);
      expect(
        await db.paymentNotification.count({
          where: {
            userId: { in: [a.userId, b.userId] },
            eventType: 'payment.upi.verified',
          },
        }),
      ).toBe(2);
      await upi.requestRefund(
        master,
        order.id,
        'Synthetic full team refund',
        true,
      );
      await upi.completeRefund(master, order.id, {
        reason: 'Synthetic outgoing team refund checked',
        confirm: true,
        evidenceReference: `${marker}-team-refund`,
        utr: utr(),
        amountMinor: 100,
        completedAt: new Date().toISOString(),
        direction: 'DEBIT',
        independentlyChecked: true,
      });
      expect(
        await db.eventEnrollment.count({
          where: {
            id: { in: [a.enrollment.id, b.enrollment.id] },
            status: 'WITHDRAWN',
          },
        }),
      ).toBe(2);
    });
  },
);
