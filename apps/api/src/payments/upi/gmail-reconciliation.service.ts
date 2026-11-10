import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type { ReconciliationMailbox } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { UpiConfig } from './upi-config';
import { decrypt, encrypt, GmailHeader } from './upi-rules';
import { UpiService } from './upi.service';
import { creditBody } from './famapp-parser';

const READONLY = 'https://www.googleapis.com/auth/gmail.readonly';
type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
};
class GmailReadError extends ServiceUnavailableException {
  constructor(
    readonly reason:
      | 'RECONNECT_REQUIRED'
      | 'READ_UNAVAILABLE'
      | 'MAILBOX_MISMATCH'
      | 'CONNECTION_CHANGED',
  ) {
    super(`${reason}: Gmail read unavailable; no settlement inferred.`);
  }
}
type Part = {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: Part[];
  headers?: GmailHeader[];
};
export function plainText(part: Part): string | null {
  if (
    part.mimeType === 'text/plain' &&
    part.body?.data &&
    (part.body.size ?? 0) <= 80000
  )
    return Buffer.from(part.body.data, 'base64url')
      .toString('utf8')
      .slice(0, 80000);
  const results = (part.parts ?? [])
    .map(plainText)
    .filter((v): v is string => v !== null);
  return results.length === 1 ? results[0] : null;
}
@Injectable()
export class GmailReconciliationService {
  private readonly tokens = new Map<
    string,
    { token: string; expiresAt: number; encryptedRefresh: string }
  >();
  private readonly refreshing = new Map<string, Promise<string>>();
  constructor(
    private readonly db: PrismaService,
    private readonly payments: PaymentsService,
    private readonly config: UpiConfig,
    private readonly upi: UpiService,
  ) {}
  private settings(requireLabel = true) {
    const clientId = this.config.get('GMAIL_RECONCILIATION_CLIENT_ID'),
      secret = this.config.get('GMAIL_RECONCILIATION_CLIENT_SECRET'),
      redirect = this.config.get('GMAIL_RECONCILIATION_REDIRECT_URI');
    if (
      this.config.get('GMAIL_RECONCILIATION_ENABLED') !== 'true' ||
      !clientId ||
      !secret ||
      !redirect ||
      !this.config.list('GMAIL_RECONCILIATION_ALLOWED_MAILBOXES').length ||
      (requireLabel && !this.config.get('GMAIL_RECONCILIATION_LABEL_ID'))
    )
      throw new ServiceUnavailableException(
        'Authorized read-only Gmail reconciliation is not configured.',
      );
    const url = new URL(redirect);
    if (
      url.pathname !== '/admin/payments' || url.search || url.hash ||
      url.username || url.password
    )
      throw new ServiceUnavailableException(
        'OAuth redirect must be the exact /admin/payments callback without credentials, query or fragment.',
      );
    if (
      url.protocol !== 'https:' &&
      !(
        this.config.get('NODE_ENV') !== 'production' &&
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname)
      )
    )
      throw new ServiceUnavailableException(
        'OAuth redirect must use HTTPS or local development.',
      );
    void this.config.key;
    return { clientId, secret, redirect };
  }
  private async request<T>(url: string, init: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new GmailReadError(
          body.error === 'invalid_grant' || response.status === 401
            ? 'RECONNECT_REQUIRED'
            : 'READ_UNAVAILABLE',
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof GmailReadError) throw error;
      throw new GmailReadError('READ_UNAVAILABLE');
    }
  }
  private async accessToken(
    box: ReconciliationMailbox,
    force = false,
  ): Promise<string> {
    const cached = this.tokens.get(box.id);
    if (
      !force &&
      cached?.encryptedRefresh === box.refreshTokenEncrypted &&
      cached.expiresAt > Date.now() + 60000
    )
      return cached.token;
    const flight = this.refreshing.get(box.id);
    if (flight) return flight;
    const pending = this.refresh(box);
    this.refreshing.set(box.id, pending);
    try {
      return await pending;
    } finally {
      this.refreshing.delete(box.id);
    }
  }
  private async refresh(box: ReconciliationMailbox) {
    const settings = this.settings(false);
    const tokens = await this.request<TokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: settings.secret,
          refresh_token: decrypt(box.refreshTokenEncrypted, this.config.key),
          grant_type: 'refresh_token',
        }),
      },
    );
    if (
      !tokens.access_token ||
      tokens.scope?.split(' ').some((s) => s !== READONLY)
    )
      throw new GmailReadError('RECONNECT_REQUIRED');
    const profile = await this.request<{ emailAddress: string }>(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (
      profile.emailAddress?.toLowerCase() !== box.email.toLowerCase() ||
      !this.config
        .list('GMAIL_RECONCILIATION_ALLOWED_MAILBOXES')
        .includes(box.email.toLowerCase())
    )
      throw new GmailReadError('MAILBOX_MISMATCH');
    const encryptedRefresh = tokens.refresh_token
      ? encrypt(tokens.refresh_token, this.config.key)
      : box.refreshTokenEncrypted;
    const saved = await this.db.reconciliationMailbox.updateMany({
      where: {
        id: box.id,
        enabled: true,
        refreshTokenEncrypted: box.refreshTokenEncrypted,
      },
      data: { refreshTokenEncrypted: encryptedRefresh },
    });
    if (saved.count !== 1) throw new GmailReadError('CONNECTION_CHANGED');
    const seconds =
      typeof tokens.expires_in === 'number' &&
      Number.isFinite(tokens.expires_in)
        ? Math.max(0, Math.min(3600, tokens.expires_in))
        : 0;
    this.tokens.set(box.id, {
      token: tokens.access_token,
      encryptedRefresh,
      expiresAt: Date.now() + seconds * 1000,
    });
    return tokens.access_token;
  }
  private async read<T>(box: ReconciliationMailbox, path: string): Promise<T> {
    const currentBox = await this.db.reconciliationMailbox.findUniqueOrThrow({
      where: { id: box.id },
    });
    if (
      !currentBox.enabled ||
      currentBox.connectedAt.getTime() !== box.connectedAt.getTime()
    )
      throw new GmailReadError('CONNECTION_CHANGED');
    const token = await this.accessToken(currentBox);
    try {
      return await this.request<T>(
        `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      if (
        !(error instanceof GmailReadError) ||
        error.reason !== 'RECONNECT_REQUIRED'
      )
        throw error;
      this.tokens.delete(box.id);
      const current = await this.db.reconciliationMailbox.findUniqueOrThrow({
        where: { id: box.id },
      });
      if (!current.enabled) throw new GmailReadError('CONNECTION_CHANGED');
      const retry = await this.accessToken(current, true);
      return this.request<T>(
        `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
        { headers: { Authorization: `Bearer ${retry}` } },
      );
    }
  }
  private async recordFailure(box: ReconciliationMailbox, error: unknown) {
    const reason =
      error instanceof GmailReadError ? error.reason : 'READ_UNAVAILABLE';
    this.tokens.delete(box.id);
    await this.db.reconciliationMailbox.updateMany({
      where: { id: box.id, connectedAt: box.connectedAt },
      data: {
        lastError: `${reason}: reconnect or retry. No settlement inferred.`,
        ...(['RECONNECT_REQUIRED', 'MAILBOX_MISMATCH'].includes(reason)
          ? { enabled: false }
          : {}),
        pageToken: null,
        scanQuery: null,
        scanStartedAt: null,
      },
    });
    return reason;
  }
  async health(actorId: string, id: string) {
    await this.payments.master(actorId);
    this.settings();
    const box = await this.db.reconciliationMailbox.findUniqueOrThrow({
      where: { id },
    });
    if (!box.enabled)
      return {
        healthy: false,
        reconnectRequired: true,
        checkedAt: new Date().toISOString(),
      };
    const leaseUntil = new Date(Date.now() + 600000);
    const lease = await this.db.reconciliationMailbox.updateMany({
      where: {
        id,
        enabled: true,
        OR: [{ pollLeaseUntil: null }, { pollLeaseUntil: { lt: new Date() } }],
      },
      data: { pollLeaseUntil: leaseUntil },
    });
    if (!lease.count)
      return {
        healthy: false,
        busy: true,
        checkedAt: new Date().toISOString(),
      };
    try {
      await this.accessToken(box, true);
      await this.read(
        box,
        `labels/${encodeURIComponent(this.config.get('GMAIL_RECONCILIATION_LABEL_ID')!)}`,
      );
      await this.db.reconciliationMailbox.updateMany({
        where: { id, enabled: true, connectedAt: box.connectedAt },
        data: { lastError: null },
      });
      await this.db.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPI_GMAIL_HEALTH_CHECK',
          resource: 'upi',
          metadata: { mailboxId: id, healthy: true },
        },
      });
      return {
        healthy: true,
        profileChecked: true,
        labelChecked: true,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      const reason = await this.recordFailure(box, error);
      return {
        healthy: false,
        reconnectRequired: [
          'RECONNECT_REQUIRED',
          'MAILBOX_MISMATCH',
          'CONNECTION_CHANGED',
        ].includes(reason),
        reason,
        checkedAt: new Date().toISOString(),
      };
    } finally {
      await this.db.reconciliationMailbox.updateMany({
        where: { id, pollLeaseUntil: leaseUntil },
        data: { pollLeaseUntil: null },
      });
    }
  }
  async labels(actorId: string, id: string) {
    await this.payments.master(actorId);
    this.settings(false);
    const box = await this.db.reconciliationMailbox.findUniqueOrThrow({
      where: { id },
    });
    if (!box.enabled) throw new GmailReadError('RECONNECT_REQUIRED');
    const result = await this.read<{ labels?: { id: string; name: string }[] }>(
      box,
      'labels',
    );
    const name = this.config.get('GMAIL_RECONCILIATION_LABEL_NAME');
    return {
      labels: (result.labels ?? [])
        .filter((label) => label.name === name)
        .map((label) => ({ id: label.id, name: label.name })),
    };
  }
  async start(actorId: string) {
    await this.payments.master(actorId);
    const settings = this.settings(false),
      state = randomBytes(32).toString('hex'),
      verifier = randomBytes(48).toString('base64url');
    await this.db.reconciliationOAuthState.create({
      data: {
        actorId,
        stateHash: createHash('sha256').update(state).digest('hex'),
        verifierEncrypted: encrypt(verifier, this.config.key),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const params = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.redirect,
      response_type: 'code',
      scope: READONLY,
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge_method: 'S256',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    });
    return {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    };
  }
  async complete(actorId: string, code: string, state: string) {
    await this.payments.master(actorId);
    const settings = this.settings(false),
      stateHash = createHash('sha256').update(state).digest('hex');
    const record = await this.db.reconciliationOAuthState.findUnique({
      where: { stateHash },
    });
    if (
      !record ||
      record.actorId !== actorId ||
      record.usedAt ||
      record.expiresAt < new Date()
    )
      throw new ForbiddenException(
        'OAuth state is invalid or expired. Start a new connection.',
      );
    const claim = await this.db.reconciliationOAuthState.updateMany({
      where: {
        stateHash,
        actorId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (claim.count !== 1)
      throw new ForbiddenException('OAuth state has already been used.');
    const tokens = await this.request<TokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: settings.secret,
          code,
          code_verifier: decrypt(record.verifierEncrypted, this.config.key),
          grant_type: 'authorization_code',
          redirect_uri: settings.redirect,
        }),
      },
    );
    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      tokens.scope?.split(' ').some((scope) => scope !== READONLY) ||
      !tokens.scope?.split(' ').includes(READONLY)
    )
      throw new BadRequestException(
        'A dedicated offline gmail.readonly grant is required. Revoke excess permissions and reconnect.',
      );
    const profile = await this.request<{ emailAddress: string }>(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    const email = profile.emailAddress.toLowerCase();
    if (
      !this.config
        .list('GMAIL_RECONCILIATION_ALLOWED_MAILBOXES')
        .includes(email)
    )
      throw new ForbiddenException(
        'This mailbox is not explicitly authorized for reconciliation.',
      );
    await this.db.$transaction(async (tx) => {
      const mailbox = await tx.reconciliationMailbox.upsert({
        where: { email },
        update: {
          refreshTokenEncrypted: encrypt(
            tokens.refresh_token!,
            this.config.key,
          ),
          connectedBy: actorId,
          connectedAt: new Date(),
          enabled: true,
          lastError: null,
        },
        create: {
          email,
          refreshTokenEncrypted: encrypt(
            tokens.refresh_token!,
            this.config.key,
          ),
          connectedBy: actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPI_GMAIL_CONNECTED',
          resource: 'upi',
          metadata: { mailboxId: mailbox.id, scope: READONLY },
        },
      });
    });
    return { connected: true };
  }
  async status(actorId: string) {
    await this.payments.master(actorId);
    const boxes = await this.db.reconciliationMailbox.findMany({
      select: {
        id: true,
        email: true,
        enabled: true,
        connectedAt: true,
        lastPollAt: true,
        lastError: true,
      },
    });
    return boxes.map(({ email, ...rest }) => ({
      ...rest,
      mailboxMasked: `${email.slice(0, 1)}•••@${email.split('@')[1]}`,
    }));
  }
  async disconnect(actorId: string, id: string) {
    await this.payments.master(actorId);
    this.tokens.delete(id);
    await this.db.$transaction(async (tx) => {
      await tx.reconciliationMailbox.update({
        where: { id },
        data: { enabled: false, refreshTokenEncrypted: '', pageToken: null },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPI_GMAIL_DISCONNECTED',
          resource: 'upi',
          metadata: { mailboxId: id },
        },
      });
    });
    return {
      disconnected: true,
      instruction:
        'Also revoke the dedicated grant in Google Account permissions.',
    };
  }
  async poll(actorId?: string) {
    if (actorId) await this.payments.master(actorId);
    this.settings();
    const boxes = await this.db.reconciliationMailbox.findMany({
      where: { enabled: true },
      take: 10,
    });
    let imported = 0,
      failures = 0;
    for (const box of boxes) {
      if (
        !this.config
          .list('GMAIL_RECONCILIATION_ALLOWED_MAILBOXES')
          .includes(box.email.toLowerCase())
      )
        continue;
      const leaseUntil = new Date(Date.now() + 600000);
      const claim = await this.db.reconciliationMailbox.updateMany({
        where: {
          id: box.id,
          enabled: true,
          OR: [
            { pollLeaseUntil: null },
            { pollLeaseUntil: { lt: new Date() } },
          ],
        },
        data: { pollLeaseUntil: leaseUntil },
      });
      if (!claim.count) continue;
      try {
        const started = box.scanStartedAt ?? new Date();
        const query =
          box.scanQuery ??
          `after:${Math.floor((started.getTime() - 30 * 86400000) / 1000)} before:${Math.floor(started.getTime() / 1000) + 1}`;
        const params = new URLSearchParams({
          labelIds: this.config.get('GMAIL_RECONCILIATION_LABEL_ID')!,
          q: query,
          maxResults: '20',
          ...(box.pageToken ? { pageToken: box.pageToken } : {}),
        });
        const list = await this.read<{
          messages?: { id: string }[];
          nextPageToken?: string;
        }>(box, `messages?${params}`);
        for (const message of list.messages ?? []) {
          if (
            (await this.db.upiCreditDelivery.findUnique({
              where: {
                mailboxId_gmailMessageId: {
                  mailboxId: box.id,
                  gmailMessageId: message.id,
                },
              },
            })) ||
            (await this.db.upiCreditNotification.findUnique({
              where: {
                mailboxId_gmailMessageId: {
                  mailboxId: box.id,
                  gmailMessageId: message.id,
                },
              },
            }))
          )
            continue;
          const data = await this.read<{
            payload: Part;
            internalDate: string;
          }>(box, `messages/${encodeURIComponent(message.id)}?format=full`);
          const receivedAt = new Date(Number(data.internalDate));
          if (!Number.isFinite(receivedAt.getTime())) throw Error();
          await this.upi.ingest({
            mailboxId: box.id,
            messageId: message.id,
            headers: data.payload.headers ?? [],
            text: creditBody(data.payload),
            receivedAt,
          });
          imported++;
        }
        await this.db.reconciliationMailbox.updateMany({
          where: { id: box.id, enabled: true, connectedAt: box.connectedAt },
          data: {
            pageToken: list.nextPageToken ?? null,
            scanQuery: list.nextPageToken ? query : null,
            scanStartedAt: list.nextPageToken ? started : null,
            lastPollAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        failures++;
        await this.recordFailure(box, error);
      } finally {
        await this.db.reconciliationMailbox.updateMany({
          where: { id: box.id, pollLeaseUntil: leaseUntil },
          data: { pollLeaseUntil: null },
        });
      }
    }
    return { imported, failures };
  }
}
