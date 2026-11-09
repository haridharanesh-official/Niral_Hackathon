import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'], credentials: true } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
 @WebSocketServer() server!: Server;
 private online=new Set<string>();
 constructor(private readonly prisma:PrismaService,private readonly jwt:JwtService){}
 private async valid(data:Record<string,unknown>) {
  if(typeof data.sessionHash!=='string'||typeof data.userId!=='string'||Number(data.expiresAt)<=Date.now())return false;
  const session=await this.prisma.session.findUnique({where:{sessionToken:data.sessionHash},include:{user:true}});
  return Boolean(session&&session.userId===data.userId&&!session.revokedAt&&session.expires>new Date()&&session.user.emailVerified&&session.user.accountStatus==='ACTIVE'&&!session.user.twoFactorEnabled);
 }
 async handleConnection(client:Socket){
  try{
   const token:unknown=client.handshake.auth?.token;
   if(token){
    if(typeof token!=='string')throw Error('Invalid session');
    const payload=await this.jwt.verifyAsync<{sub:string;exp:number}>(token);
    client.data.userId=payload.sub;client.data.expiresAt=payload.exp*1000;client.data.sessionHash=createHash('sha256').update(token).digest('hex');
    if(!await this.valid(client.data))throw Error('Invalid session');
    await client.join('user:'+payload.sub);
   }
   client.data.ready=true;this.online.add(client.id);this.server.emit('presence:update',{online:this.online.size});
  }catch{client.disconnect(true);}
 }
 handleDisconnect(client:Socket){this.online.delete(client.id);this.server.emit('presence:update',{online:this.online.size});}
 private async allowed(client:Socket,room:unknown){
  if(!client.data.ready||typeof room!=='string')return false;
  if(/^public:[a-z0-9-]{1,60}$/.test(room))return true;
  if(!room.startsWith('team:')||!await this.valid(client.data))return false;
  return Boolean(await this.prisma.teamMember.findFirst({where:{teamId:room.slice(5),userId:client.data.userId as string}}));
 }
 @SubscribeMessage('room:join')
 async joinRoom(@MessageBody()payload:{room?:unknown},@ConnectedSocket()client:Socket){if(!await this.allowed(client,payload?.room))return{error:'Room access denied'};await client.join(payload.room as string);return{joined:payload.room};}
 @SubscribeMessage('chat:message')
 async handleChat(@MessageBody()payload:{room?:unknown;message?:unknown},@ConnectedSocket()client:Socket){if(!await this.allowed(client,payload?.room)||typeof payload.message!=='string'||payload.message.length>2000)return{error:'Message denied'};this.server.to(payload.room as string).emit('chat:message',{room:payload.room,message:payload.message,user:client.data.userId??'guest',at:new Date().toISOString(),from:client.id});}
 @SubscribeMessage('typing')
 async typing(@MessageBody()payload:{room?:unknown;isTyping?:unknown},@ConnectedSocket()client:Socket){if(!await this.allowed(client,payload?.room))return;this.server.to(payload.room as string).emit('typing',{room:payload.room,user:client.data.userId??'guest',isTyping:payload.isTyping===true});}
 broadcastAnnouncement(title:string,body:string){this.server.emit('announcement',{title,body,at:new Date().toISOString()});}
 async emitDashboardEvent(event:string,userId:string,payload:Record<string,unknown>){
  try{for(const socket of await this.server.in('user:'+userId).fetchSockets()){if(await this.valid(socket.data))socket.emit(event,{...payload,userId,version:Date.now(),at:new Date().toISOString()});else socket.disconnect(true);}}catch{/* Never broadcast as a fallback when session validation fails. */}
 }
}
