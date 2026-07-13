import { Injectable } from '@nestjs/common';
import { APP_NAME, APP_TAGLINE } from '@hackos/shared';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: APP_NAME,
      tagline: APP_TAGLINE,
      version: '1.0.0',
      phase: 9,
      status: 'production-ready-scaffold',
    };
  }
}
