import { Module } from '@nestjs/common';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { EventsModule } from '../events/events.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamsModule } from '../teams/teams.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TeamsModule,
    EnrollmentModule,
    NotificationsModule,
    LeaderboardModule,
    EventsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
