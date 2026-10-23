import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { QuizModule } from './quiz/quiz.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { SessionModule } from './session/session.module';
import { ApiVersionInterceptor } from './common/interceptors/api-response.interceptor';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectModule } from './project/project.module';
import { SubmissionModule } from './submission/submission.module';
import { JudgeModule } from './judge/judge.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    TeamsModule,
    QuizModule,
    LeaderboardModule,
    EventsModule,
    EnrollmentModule,
    NotificationsModule,
    AuditModule,
    SessionModule,
    DashboardModule,
    ProjectModule,
    SubmissionModule,
    JudgeModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ApiVersionInterceptor },
  ],
})
export class AppModule {}
