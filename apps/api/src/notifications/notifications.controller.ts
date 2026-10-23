import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type AuthRequest = Request & { user: { userId: string } };

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: AuthRequest) {
    return this.notificationsService.recent(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('read-all')
  markAll(@Req() req: AuthRequest) {
    return this.notificationsService.markAllRead(req.user.userId);
  }
}
