import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { UpiService } from './upi.service';
import { UpiConfig } from './upi-config';
import { decrypt } from './upi-rules';
import { GmailReconciliationService } from './gmail-reconciliation.service';
type StateInput = {
  data: {
    actorId: string;
    stateHash: string;
    verifierEncrypted: string;
    expiresAt: Date;
  };
};
function fixture(redirect = 'http://localhost:3000/admin/payments') {
  const key = randomBytes(32).toString('base64');
  const config = new ConfigService({
    NODE_ENV: 'development',
    GMAIL_RECONCILIATION_ENABLED: 'true',
    GMAIL_RECONCILIATION_CLIENT_ID: 'synthetic-client',
    GMAIL_RECONCILIATION_CLIENT_SECRET: 'synthetic-secret',
    GMAIL_RECONCILIATION_REDIRECT_URI: redirect,
    GMAIL_RECONCILIATION_ALLOWED_MAILBOXES: 'synthetic@example.test',
    UPI_RECONCILIATION_KEY: key,
  });
  const state = {
    create: jest.fn<Promise<void>, [StateInput]>().mockResolvedValue(undefined),
    findUnique: jest.fn().mockResolvedValue(null),
  };
  const service = new GmailReconciliationService(
    { reconciliationOAuthState: state } as unknown as PrismaService,
    {
      master: jest.fn().mockResolvedValue(undefined),
    } as unknown as PaymentsService,
    new UpiConfig(config),
    {} as UpiService,
  );
  return { service, state, key };
}
describe('Dedicated reconciliation OAuth boundary (protocol fixtures only)', () => {
  it.each([
    'http://localhost:3000/api/auth/callback/google',
    'https://staging.example.test/admin/payments/',
    'https://user:pass@staging.example.test/admin/payments',
    'https://staging.example.test/admin/payments?q=1',
    'https://staging.example.test/admin/payments#x',
  ])('rejects an inexact or unsafe callback %s', async (redirect) => {
    await expect(fixture(redirect).service.start('master')).rejects.toThrow(
      'exact',
    );
  });
  it('uses read-only scope, S256 PKCE, actor-bound hashed state and encrypted verifier', async () => {
    const t = fixture(),
      url = new URL((await t.service.start('master')).authorizationUrl),
      params = url.searchParams,
      record = t.state.create.mock.calls[0][0].data;
    expect(params.get('scope')).toBe(
      'https://www.googleapis.com/auth/gmail.readonly',
    );
    expect(params.get('redirect_uri')).toBe(
      'http://localhost:3000/admin/payments',
    );
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(record.actorId).toBe('master');
    expect(record.stateHash).toBe(
      createHash('sha256').update(params.get('state')!).digest('hex'),
    );
    const verifier = decrypt(
      record.verifierEncrypted,
      Buffer.from(t.key, 'base64'),
    );
    expect(params.get('code_challenge')).toBe(
      createHash('sha256').update(verifier).digest('base64url'),
    );
    expect(record.verifierEncrypted).not.toContain(verifier);
  });
  it.each(['other-actor', 'expired', 'used'])(
    'rejects %s state before contacting Google',
    async (kind) => {
      const t = fixture();
      t.state.findUnique.mockResolvedValue({
        actorId: kind === 'other-actor' ? 'other' : 'master',
        usedAt: kind === 'used' ? new Date() : null,
        expiresAt:
          kind === 'expired' ? new Date(0) : new Date(Date.now() + 60000),
      });
      const fetch = jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('must not fetch'));
      try {
        await expect(
          t.service.complete('master', 'synthetic-code', 'synthetic-state'),
        ).rejects.toThrow('state');
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        fetch.mockRestore();
      }
    },
  );
});
