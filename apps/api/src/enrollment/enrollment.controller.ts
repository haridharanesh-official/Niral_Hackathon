import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentService } from './enrollment.service';
import { EnrollEventDto } from './dto/enroll.dto';

type AuthRequest = Request & { user: { userId: string } };

@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.enrollmentService.myEnrollment(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('event')
  activeEvent() {
    return this.enrollmentService.getActiveEvent();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  enroll(@Req() req: AuthRequest, @Body() dto: EnrollEventDto) {
    return this.enrollmentService.enroll(req.user.userId, dto);
  }
}
