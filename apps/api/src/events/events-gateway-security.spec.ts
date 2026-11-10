import { EventsGateway } from './events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Private socket delivery authorization', () => {
  type Client = Parameters<EventsGateway['handleChat']>[1];
  function socket(id: string, hash = id, expiresAt = Date.now() + 60_000) {
    const rooms = new Set(['team:test']);
    return {
      id,
      rooms,
      data: { userId: id, sessionHash: hash, expiresAt, ready: true },
      emit: jest.fn(),
      leave: jest.fn(async (room: string) => {
        rooms.delete(room);
      }),
      disconnect: jest.fn(),
      join: jest.fn(async (room: string) => {
        rooms.add(room);
      }),
    };
  }
  function fixture() {
    const session = (id: string) => ({
      userId: id,
      revokedAt: null as Date | null,
      expires: new Date(Date.now() + 60_000),
      user: {
        emailVerified: new Date(),
        accountStatus: 'ACTIVE',
        twoFactorEnabled: false,
      },
    });
    const sessions = new Map([
      ['sender', session('sender')],
      ['active', session('active')],
      ['other-session', session('active')],
    ]);
    const members = new Set(['sender', 'active']);
    const db = {
      session: {
        findUnique: jest.fn(
          async ({ where }: { where: { sessionToken: string } }) =>
            sessions.get(where.sessionToken) ?? null,
        ),
      },
      teamMember: {
        findFirst: jest.fn(async ({ where }: { where: { userId?: string } }) =>
          members.has(where.userId ?? '') ? { id: 'membership' } : null,
        ),
      },
    };
    const recipients: ReturnType<typeof socket>[] = [];
    const broadcast = jest.fn();
    const server = {
      in: jest.fn((room: string) => ({
        fetchSockets: jest.fn(async () =>
          recipients.filter((s) => s.rooms.has(room)),
        ),
      })),
      to: jest.fn(() => ({ emit: broadcast })),
      emit: jest.fn(),
    };
    const gateway = new EventsGateway(
      db as unknown as PrismaService,
      {} as JwtService,
    );
    gateway.server = server as unknown as EventsGateway['server'];
    return { gateway, db, members, sessions, recipients, broadcast };
  }
  it('rechecks every concurrent connection, including independently revoked sessions for the same user', async () => {
    const t = fixture();
    const valid = socket('active'),
      revoked = socket('active', 'other-session');
    t.sessions.get('other-session')!.revokedAt = new Date();
    t.recipients.push(valid, revoked);
    await t.gateway.handleChat(
      { room: 'team:test', message: 'private' },
      socket('sender') as unknown as Client,
    );
    expect(valid.emit).toHaveBeenCalledWith(
      'chat:message',
      expect.objectContaining({ message: 'private' }),
    );
    expect(revoked.emit).not.toHaveBeenCalled();
    expect(revoked.disconnect).toHaveBeenCalledWith(true);
    expect(t.broadcast).not.toHaveBeenCalled();
  });
  it('removes a former member at delivery and permits legitimate membership restoration', async () => {
    const t = fixture(),
      recipient = socket('active');
    t.recipients.push(recipient);
    t.members.delete('active');
    await t.gateway.typing(
      { room: 'team:test', isTyping: true },
      socket('sender') as unknown as Client,
    );
    expect(recipient.emit).not.toHaveBeenCalled();
    expect(recipient.leave).toHaveBeenCalledWith('team:test');
    t.members.add('active');
    await expect(
      t.gateway.joinRoom({ room: 'team:test' }, recipient as unknown as Client),
    ).resolves.toEqual({ joined: 'team:test' });
    expect(recipient.join).toHaveBeenCalledWith('team:test');
    await t.gateway.typing(
      { room: 'team:test', isTyping: true },
      socket('sender') as unknown as Client,
    );
    expect(recipient.emit).toHaveBeenCalledWith(
      'typing',
      expect.objectContaining({ isTyping: true }),
    );
  });
  it.each(['jwt-expired', 'session-expired', 'suspended', 'two-factor'])(
    'rejects recipient lifecycle state %s',
    async (state) => {
      const t = fixture(),
        recipient = socket('active');
      t.recipients.push(recipient);
      if (state === 'jwt-expired') recipient.data.expiresAt = Date.now() - 1;
      if (state === 'session-expired')
        t.sessions.get('active')!.expires = new Date(0);
      if (state === 'suspended')
        t.sessions.get('active')!.user.accountStatus = 'SUSPENDED';
      if (state === 'two-factor')
        t.sessions.get('active')!.user.twoFactorEnabled = true;
      await t.gateway.handleChat(
        { room: 'team:test', message: 'private' },
        socket('sender') as unknown as Client,
      );
      expect(recipient.emit).not.toHaveBeenCalled();
      expect(recipient.disconnect).toHaveBeenCalled();
    },
  );
  it('fails closed when recipient validation fails', async () => {
    const t = fixture(),
      recipient = socket('active');
    t.recipients.push(recipient);
    t.db.session.findUnique.mockImplementation(async ({ where }) => {
      if (where.sessionToken === 'active') throw Error('unavailable');
      return t.sessions.get(where.sessionToken) ?? null;
    });
    await t.gateway.handleChat(
      { room: 'team:test', message: 'secret' },
      socket('sender') as unknown as Client,
    );
    expect(recipient.emit).not.toHaveBeenCalled();
    expect(t.broadcast).not.toHaveBeenCalled();
  });
  it('denies a removed sender and preserves public guest delivery', async () => {
    const t = fixture();
    t.members.delete('sender');
    await expect(
      t.gateway.handleChat(
        { room: 'team:test', message: 'private' },
        socket('sender') as unknown as Client,
      ),
    ).resolves.toEqual({ error: 'Message denied' });
    expect(t.broadcast).not.toHaveBeenCalled();
    await t.gateway.handleChat({ room: 'public:help', message: 'hello' }, {
      id: 'guest',
      data: { ready: true },
    } as Client);
    expect(t.broadcast).toHaveBeenCalledWith(
      'chat:message',
      expect.objectContaining({ message: 'hello', user: 'guest' }),
    );
  });
});
