import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@hackos/shared';
import { TeamsService } from './teams.service';
import {
  CreateTeamDto,
  InviteMemberDto,
  JoinTeamDto,
  RequestJoinDto,
  RespondJoinDto,
} from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

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
  @Get('discover')
  discover(@Req() req: AuthRequest) {
    return this.teamsService.listPublic(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TEAM_CREATE)
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(@Req() req: AuthRequest, @Body() dto: JoinTeamDto) {
    return this.teamsService.join(req.user.userId, dto.inviteCode);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TEAM_INVITE)
  @Post('invite')
  invite(@Req() req: AuthRequest, @Body() dto: InviteMemberDto) {
    return this.teamsService.inviteMember(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept-invite')
  acceptInvite(@Req() req: AuthRequest, @Body() body: { token: string }) {
    return this.teamsService.acceptInvite(req.user.userId, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-join')
  requestJoin(@Req() req: AuthRequest, @Body() dto: RequestJoinDto) {
    return this.teamsService.requestJoin(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('respond-join')
  respondJoin(@Req() req: AuthRequest, @Body() dto: RespondJoinDto) {
    return this.teamsService.respondJoin(
      req.user.userId,
      dto.requestId,
      dto.accept,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.teamsService.list();
  }
}
