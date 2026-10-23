import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionService } from './session.service';

type AuthRequest = Request & {
  user: { userId: string };
  headers: { authorization?: string };
};

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.sessionService.listForUser(req.user.userId);
  }

  @Delete(':id')
  revoke(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.sessionService.revoke(req.user.userId, id);
  }

  @Post('revoke-others')
  revokeOthers(@Req() req: AuthRequest) {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const keep = token ? this.sessionService.hashToken(token) : undefined;
    return this.sessionService.revokeOthers(req.user.userId, keep);
  }

  @Post('revoke-all')
  revokeAll(@Req() req: AuthRequest) {
    return this.sessionService.revokeAll(req.user.userId);
  }
}
