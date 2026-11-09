import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsGateway, EventsService],
  exports: [EventsGateway, EventsService],
})
export class EventsModule {}
