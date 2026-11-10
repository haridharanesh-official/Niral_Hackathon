import { validateSync } from 'class-validator';
import { InviteMemberDto } from './dto/team.dto';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { escapeHtml } from '../payments/payment-rules';

describe('Team invitation and discovery boundaries', () => {
  it('rejects malformed invitation recipients before mail address parsing', () => {
    for (const email of [
      'not-an-email',
      'a@example.test\r\nBcc: other@example.test',
      'a@example.test,b@example.test',
    ]) {
      expect(
        validateSync(
          Object.assign(new InviteMemberDto(), { teamId: 'team', email }),
        ).some((error) => error.property === 'email'),
      ).toBe(true);
    }
    expect(
      validateSync(
        Object.assign(new InviteMemberDto(), {
          teamId: 'team',
          email: 'recipient@example.test',
        }),
      ),
    ).toHaveLength(0);
  });
  function fixture(name = 'NIRAL மாணவர்கள் & builders') {
    const db = {
      team: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'team',
          name,
          leaderId: 'leader',
          eventId: 'event',
          maxMembers: 4,
          members: [],
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      teamInvitation: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'invite', expiresAt: new Date() }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ profile: {} }) },
    };
    const send = jest
      .fn<Promise<void>, [{ html: string; subject: string }]>()
      .mockResolvedValue(undefined);
    const service = new TeamsService(
      db as unknown as PrismaService,
      {
        record: jest.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
      { send } as unknown as MailService,
    );
    return { db, send, service };
  }
  it.each([
    '<a href="https://attacker.example.test">Prize</a>',
    '</strong><img src=x onerror=alert(1)>',
    `Quotes " ' & < >`,
    '&lt;img&gt; &amp; Unicode தமிழ் 🚀',
    'Ordinary student team',
  ])(
    'renders name as text while preserving template and token: %s',
    async (name) => {
      const t = fixture(name);
      const result = await t.service.inviteMember('leader', {
        teamId: 'team',
        email: 'recipient@example.test',
      });
      const html = t.send.mock.calls[0][0].html;
      expect(html).toContain(`<strong>${escapeHtml(name)}</strong>`);
      expect(html).toContain(`<code>${result.invitationToken}</code>`);
      expect(html).not.toMatch(/<a\b|<img\b/i);
      expect(t.send.mock.calls[0][0].subject).toContain(name);
    },
  );
  it('requires leadership before creating or sending an invitation', async () => {
    const t = fixture();
    await expect(
      t.service.inviteMember('outsider', {
        teamId: 'team',
        email: 'recipient@example.test',
      }),
    ).rejects.toThrow('Only the team leader');
    expect(t.send).not.toHaveBeenCalled();
    expect(t.db.teamInvitation.create).not.toHaveBeenCalled();
  });
  it('filters private teams by current membership and projects discovery fields explicitly', async () => {
    const t = fixture();
    await t.service.list('member');
    expect(t.db.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { visibility: 'PUBLIC' },
            { members: { some: { userId: 'member' } } },
          ],
        },
      }),
    );
    const args = t.db.team.findMany.mock.calls[0] as unknown as [
      { select: Record<string, unknown> },
    ];
    expect(args[0].select.name).toBe(true);
    expect(args[0].select.members).toBeDefined();
    expect(args[0].select.leader).toBeDefined();
    expect(args[0].select).not.toHaveProperty('inviteCode');
    expect(args[0].select).not.toHaveProperty('billingLocked');
    expect(JSON.stringify(args[0].select)).not.toContain('email');
  });
  it('public discovery shares the same non-secret projection', async () => {
    const t = fixture();
    await t.service.listPublic('viewer');
    const args = t.db.team.findMany.mock.calls[0] as unknown as [
      { where: { visibility: string }; select: Record<string, unknown> },
    ];
    expect(args[0].where.visibility).toBe('PUBLIC');
    expect(args[0].select).not.toHaveProperty('inviteCode');
    expect(JSON.stringify(args[0].select)).not.toContain('email');
  });
});
