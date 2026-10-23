import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@hackos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SubmissionService } from './submission.service';
import {
  AcceptComplianceDto,
  AddDeliverableDto,
  CreateVersionDto,
  SubmitProjectDto,
  UpdateDeliverableDto,
  UpdateSubmissionDetailsDto,
} from './dto/submission.dto';

type AuthRequest = Request & { user: { userId: string } };

@Controller('submission')
export class SubmissionController {
  constructor(private readonly submission: SubmissionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  workspace(@Req() req: AuthRequest) {
    return this.submission.getWorkspace(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preview')
  preview(@Req() req: AuthRequest) {
    return this.submission.getPreview(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('details')
  updateDetails(@Req() req: AuthRequest, @Body() dto: UpdateSubmissionDetailsDto) {
    return this.submission.updateDetails(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deliverables')
  addDeliverable(@Req() req: AuthRequest, @Body() dto: AddDeliverableDto) {
    return this.submission.addDeliverable(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deliverables/:id')
  updateDeliverable(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.submission.updateDeliverable(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deliverables/:id')
  removeDeliverable(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.submission.removeDeliverable(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('compliance')
  acceptCompliance(@Req() req: AuthRequest, @Body() dto: AcceptComplianceDto) {
    return this.submission.acceptCompliance(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  validate(@Req() req: AuthRequest) {
    return this.submission.runValidation(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('versions')
  listVersions(@Req() req: AuthRequest) {
    return this.submission.listVersions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('versions')
  createVersion(@Req() req: AuthRequest, @Body() dto: CreateVersionDto) {
    return this.submission.createVersion(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('versions/:version/restore')
  restoreVersion(
    @Req() req: AuthRequest,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.submission.restoreVersion(req.user.userId, version);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TEAM_SUBMIT)
  @Post('submit')
  submit(@Req() req: AuthRequest, @Body() dto: SubmitProjectDto) {
    return this.submission.submitProject(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('receipt')
  receipt(@Req() req: AuthRequest) {
    return this.submission.getReceiptForUser(req.user.userId);
  }

  @Get('showcase/:teamSlug')
  showcase(@Param('teamSlug') teamSlug: string) {
    return this.submission.getShowcase(teamSlug);
  }
}
