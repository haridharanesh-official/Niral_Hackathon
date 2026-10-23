import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionValidationService } from './submission-validation.service';
import { TeamsModule } from '../teams/teams.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TeamsModule, NotificationsModule, EventsModule],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionValidationService],
  exports: [SubmissionService, SubmissionValidationService],
})
export class SubmissionModule {}
