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

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private online = new Set<string>();

  handleConnection(client: Socket) {
    this.online.add(client.id);
    this.server.emit('presence:update', { online: this.online.size });
  }

  handleDisconnect(client: Socket) {
    this.online.delete(client.id);
    this.server.emit('presence:update', { online: this.online.size });
  }

  @SubscribeMessage('chat:message')
  handleChat(
    @MessageBody() payload: { room: string; message: string; user: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(payload.room).emit('chat:message', {
      ...payload,
      at: new Date().toISOString(),
      from: client.id,
    });
  }

  @SubscribeMessage('room:join')
  joinRoom(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.room);
    return { joined: payload.room };
  }

  @SubscribeMessage('typing')
  typing(
    @MessageBody() payload: { room: string; user: string; isTyping: boolean },
  ) {
    this.server.to(payload.room).emit('typing', payload);
  }

  broadcastAnnouncement(title: string, body: string) {
    this.server.emit('announcement', { title, body, at: new Date().toISOString() });
  }

  emitDashboardEvent(event: string, userId: string, payload: Record<string, unknown>) {
    this.server.emit(event, {
      ...payload,
      userId,
      version: Date.now(),
      at: new Date().toISOString(),
    });
  }
}
