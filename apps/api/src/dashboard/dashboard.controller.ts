import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  NotificationsQueryDto,
  TaskUpdateDto,
  WidgetConfigDto,
} from './dto/dashboard.dto';

type AuthRequest = Request & { user: { userId: string } };

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@Req() req: AuthRequest) {
    return this.dashboard.summary(req.user.userId);
  }

  @Get('announcements')
  announcements(@Req() req: AuthRequest) {
    return this.dashboard.announcements(req.user.userId);
  }

  @Post('announcements/:id/read')
  markAnnouncementRead(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.dashboard.markAnnouncementRead(req.user.userId, id);
  }

  @Post('announcements/read-all')
  markAllAnnouncementsRead(@Req() req: AuthRequest) {
    return this.dashboard.markAllAnnouncementsRead(req.user.userId);
  }

  @Get('notifications')
  notifications(@Req() req: AuthRequest, @Query() query: NotificationsQueryDto) {
    return this.dashboard.notificationsFeed(req.user.userId, query);
  }

  @Get('tasks')
  tasks(@Req() req: AuthRequest) {
    return this.dashboard.tasks(req.user.userId);
  }

  @Patch('tasks')
  upsertTask(@Req() req: AuthRequest, @Body() dto: TaskUpdateDto) {
    return this.dashboard.upsertTask(req.user.userId, dto);
  }

  @Patch('widgets')
  updateWidgetConfig(@Req() req: AuthRequest, @Body() dto: WidgetConfigDto) {
    return this.dashboard.updateWidgetConfig(req.user.userId, dto);
  }

  @Get('team')
  team(@Req() req: AuthRequest) {
    return this.dashboard.teamOverview(req.user.userId);
  }

  @Get('calendar')
  calendar(@Req() req: AuthRequest) {
    return this.dashboard.calendar(req.user.userId);
  }

  @Get('activity')
  activity(@Req() req: AuthRequest) {
    return this.dashboard.activityFeed(req.user.userId);
  }

  @Get('leaderboard')
  leaderboard() {
    return this.dashboard.leaderboardSnapshot();
  }

  @Post('tasks/refresh')
  refreshTasks(@Req() req: AuthRequest) {
    return this.dashboard.tasks(req.user.userId);
  }
}
