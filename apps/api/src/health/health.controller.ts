import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok', service: 'niral-api' };
  }

  @Get(['', 'ready'])
  async check(@Res({ passthrough: true }) response: Response) {
    const health = await this.healthService.check();
    if (health.status !== 'ok') response.status(503);
    return health;
  }
}
