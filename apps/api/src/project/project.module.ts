import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ExecutionController } from './execution.controller';
import { CollaborationController } from './collaboration.controller';
import { ProjectService } from './project.service';
import { ExecutionService } from './execution.service';
import { CollaborationService } from './collaboration.service';
import { TeamsModule } from '../teams/teams.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TeamsModule, EventsModule, NotificationsModule],
  controllers: [
    ProjectController,
    ExecutionController,
    CollaborationController,
  ],
  providers: [ProjectService, ExecutionService, CollaborationService],
  exports: [ProjectService, ExecutionService, CollaborationService],
})
export class ProjectModule {}
