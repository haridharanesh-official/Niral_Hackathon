import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { CreateTeamDto, JoinTeamDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = Request & { user: { userId: string } };

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  myTeam(@Req() req: AuthRequest) {
    return this.teamsService.getMyTeam(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(@Req() req: AuthRequest, @Body() dto: JoinTeamDto) {
    return this.teamsService.join(req.user.userId, dto.inviteCode);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.teamsService.list();
  }
}
