import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { API_VERSION } from '@hackos/shared';
import { Observable } from 'rxjs';
import type { Response } from 'express';

/** Sets X-API-Version on every response (contract v1). */
@Injectable()
export class ApiVersionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('X-API-Version', API_VERSION);
    return next.handle();
  }
}
