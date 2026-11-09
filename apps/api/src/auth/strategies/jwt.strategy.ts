import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { createHash } from 'crypto';
import { UserRole } from '@hackos/shared';
import { PrismaService } from '../../prisma/prisma.service';
export type JwtPayload = { sub: string; email: string; role: UserRole };
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if ((secret?.length ?? 0) < 32 && config.get('NODE_ENV') === 'production')
      throw new Error(
        'JWT_SECRET must contain at least 32 characters in production',
      );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret ?? 'dev-secret-change-me',
      passReqToCallback: true,
    });
  }
  async validate(req: Request, payload: JwtPayload) {
    const raw = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!raw) throw new UnauthorizedException('Session expired');
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: createHash('sha256').update(raw).digest('hex') },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expires <= new Date() ||
      !session.user.emailVerified ||
      ['SUSPENDED', 'ARCHIVED'].includes(session.user.accountStatus) ||
      session.user.twoFactorEnabled
    ) {
      throw new UnauthorizedException('Session expired or account unavailable');
    }
    return {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  }
}
