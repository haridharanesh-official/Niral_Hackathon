import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type Events = Record<string, (...args: unknown[]) => void>;
type SocketIdentity = {
  userId?: string;
  expiresAt?: number;
  sessionHash?: string;
  ready?: boolean;
};
type ClientSocket = Socket<Events, Events, Events, SocketIdentity>;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server<Events, Events, Events, SocketIdentity>;
  private online = new Set<string>();
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async valid(data: SocketIdentity) {
    if (
      typeof data.sessionHash !== 'string' ||
      typeof data.userId !== 'string' ||
      typeof data.expiresAt !== 'number' ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt <= Date.now()
    )
      return false;
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: data.sessionHash },
      include: { user: true },
    });
    return Boolean(
      session &&
      session.userId === data.userId &&
      !session.revokedAt &&
      session.expires > new Date() &&
      session.user.emailVerified &&
      session.user.accountStatus === 'ACTIVE' &&
      !session.user.twoFactorEnabled,
    );
  }

  async handleConnection(client: ClientSocket) {
    try {
      const auth: unknown = client.handshake.auth;
      const token =
        auth && typeof auth === 'object'
          ? (auth as Record<string, unknown>).token
          : undefined;
      if (token !== undefined) {
        if (typeof token !== 'string' || !token) throw Error('Invalid session');
        const payload = await this.jwt.verifyAsync<{
          sub: string;
          exp: number;
        }>(token);
        client.data = {
          userId: payload.sub,
          expiresAt: payload.exp * 1000,
          sessionHash: createHash('sha256').update(token).digest('hex'),
        };
        if (!(await this.valid(client.data))) throw Error('Invalid session');
        await client.join('user:' + payload.sub);
      }
      client.data.ready = true;
      this.online.add(client.id);
      this.server.emit('presence:update', { online: this.online.size });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: ClientSocket) {
    this.online.delete(client.id);
    this.server.emit('presence:update', { online: this.online.size });
  }

  private async allowed(client: ClientSocket, room: unknown) {
    if (!client.data.ready || typeof room !== 'string') return false;
    if (/^public:[a-z0-9-]{1,60}$/.test(room)) return true;
    if (
      !/^team:[a-zA-Z0-9_-]{1,100}$/.test(room) ||
      !(await this.valid(client.data))
    )
      return false;
    return Boolean(
      await this.prisma.teamMember.findFirst({
        where: { teamId: room.slice(5), userId: client.data.userId },
      }),
    );
  }

  // Private room membership is only a routing hint. Every recipient connection
  // must still own a current session and current team membership at delivery.
  private async deliver(
    room: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    if (room.startsWith('public:')) {
      this.server.to(room).emit(event, payload);
      return;
    }
    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      try {
        if (!(await this.valid(socket.data))) {
          socket.disconnect(true);
          continue;
        }
        if (
          !(await this.prisma.teamMember.findFirst({
            where: { teamId: room.slice(5), userId: socket.data.userId },
          }))
        ) {
          socket.leave(room);
          continue;
        }
        socket.emit(event, payload);
      } catch {
        socket.leave(room);
      }
    }
  }

  @SubscribeMessage('room:join')
  async joinRoom(
    @MessageBody() payload: { room?: unknown },
    @ConnectedSocket() client: ClientSocket,
  ) {
    try {
      if (!(await this.allowed(client, payload?.room)))
        return { error: 'Room access denied' };
      await client.join(payload.room as string);
      return { joined: payload.room };
    } catch {
      return { error: 'Room access denied' };
    }
  }

  @SubscribeMessage('chat:message')
  async handleChat(
    @MessageBody() payload: { room?: unknown; message?: unknown },
    @ConnectedSocket() client: ClientSocket,
  ) {
    try {
      if (
        !(await this.allowed(client, payload?.room)) ||
        typeof payload.message !== 'string' ||
        payload.message.length > 2000
      )
        return { error: 'Message denied' };
      await this.deliver(payload.room as string, 'chat:message', {
        room: payload.room,
        message: payload.message,
        user: client.data.userId ?? 'guest',
        at: new Date().toISOString(),
        from: client.id,
      });
    } catch {
      return { error: 'Message denied' };
    }
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody() payload: { room?: unknown; isTyping?: unknown },
    @ConnectedSocket() client: ClientSocket,
  ) {
    try {
      if (!(await this.allowed(client, payload?.room))) return;
      await this.deliver(payload.room as string, 'typing', {
        room: payload.room,
        user: client.data.userId ?? 'guest',
        isTyping: payload.isTyping === true,
      });
    } catch {
      /* Deny private delivery when authorization infrastructure fails. */
    }
  }

  broadcastAnnouncement(title: string, body: string) {
    this.server.emit('announcement', {
      title,
      body,
      at: new Date().toISOString(),
    });
  }
  async emitDashboardEvent(
    event: string,
    userId: string,
    payload: Record<string, unknown>,
  ) {
    try {
      for (const socket of await this.server
        .in('user:' + userId)
        .fetchSockets()) {
        if (await this.valid(socket.data))
          socket.emit(event, {
            ...payload,
            userId,
            version: Date.now(),
            at: new Date().toISOString(),
          });
        else socket.disconnect(true);
      }
    } catch {
      /* Never broadcast as a fallback when session validation fails. */
    }
  }
}
