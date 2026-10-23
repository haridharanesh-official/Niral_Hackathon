import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditModule } from '../audit/audit.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Access token default 30m (SRS §23 / §60); override with JWT_EXPIRES_IN
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '30m';
        return {
          secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
          signOptions: {
            expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}m` | `${number}s`,
          },
        };
      },
    }),
    AuditModule,
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
