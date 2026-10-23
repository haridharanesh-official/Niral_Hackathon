import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@hackos/shared';
import { EventsService } from './events.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthRequest = Request & {
  user: { userId: string; role: string; email: string };
};

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('current')
  getCurrent() {
    return this.eventsService.getCurrentEvent();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @Get('admin/:id')
  getAdminEvent(@Param('id') id: string) {
    return this.eventsService.getAdminEvent(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @Patch('admin/:id')
  updateAdminEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: AuthRequest,
  ) {
    return this.eventsService.updateAdminEvent(id, dto, req.user.userId);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.eventsService.getBySlug(slug);
  }
}
