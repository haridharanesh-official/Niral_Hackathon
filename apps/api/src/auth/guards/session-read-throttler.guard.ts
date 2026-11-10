import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Server-rendered clients share an IP. Only a signed identity can split the
 * session-read bucket; login, recovery and unauthenticated limits stay per IP.
 * JwtAuthGuard still checks revocation/account state before returning data. */
@Injectable()
export class SessionReadThrottlerGuard extends ThrottlerGuard {
  @Inject(JwtService) private readonly jwt!: JwtService;

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    if (req.method === 'GET' && req.path === '/api/auth/me') {
      const headers = req.headers as Record<string, unknown> | undefined;
      const authorization = headers?.authorization;
      if (
        typeof authorization === 'string' &&
        authorization.startsWith('Bearer ')
      ) {
        try {
          const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(
            authorization.slice(7),
          );
          if (typeof payload.sub === 'string' && payload.sub.length > 0)
            return 'session-read:' + payload.sub;
        } catch {
          /* Invalid/expired tokens retain the IP bucket. */
        }
      }
    }
    return super.getTracker(req);
  }
}
