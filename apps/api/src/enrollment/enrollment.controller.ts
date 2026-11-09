import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentService } from './enrollment.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@hackos/shared';
import { EnrollEventDto, EnrollmentStatusDto } from './dto/enroll.dto';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @Patch(':id/status')
  status(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: EnrollmentStatusDto,
  ) {
    return this.enrollmentService.transition(id, dto.status, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  enroll(@Req() req: AuthRequest, @Body() dto: EnrollEventDto) {
    return this.enrollmentService.enroll(req.user.userId, dto);
  }
}
