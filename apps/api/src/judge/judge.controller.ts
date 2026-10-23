import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@hackos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JudgeService } from './judge.service';
import {
  CreateAssignmentDto,
  SaveEvaluationDto,
  SubmitEvaluationDto,
  ToggleBookmarkDto,
  UpdateNoteDto,
} from './dto/judge.dto';

type AuthRequest = Request & { user: { userId: string } };

@Controller('judge')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.JUDGE_VIEW_SUBMISSIONS)
export class JudgeController {
  constructor(private readonly judge: JudgeService) {}

  @Get('dashboard')
  dashboard(@Req() req: AuthRequest) {
    return this.judge.getDashboard(req.user.userId);
  }

  @Get('assignments')
  listAssignments(
    @Req() req: AuthRequest,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.judge.listAssignments(req.user.userId, {
      status: status as never,
      sort,
    });
  }

  @Get('assignments/:id')
  getWorkspace(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.judge.getAssignmentWorkspace(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.JUDGE_EVALUATE)
  @Patch('assignments/:id/evaluation')
  saveEvaluation(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SaveEvaluationDto,
  ) {
    return this.judge.saveEvaluation(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.JUDGE_EVALUATE)
  @Post('assignments/:id/evaluation/submit')
  submitEvaluation(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SubmitEvaluationDto,
  ) {
    return this.judge.submitEvaluation(req.user.userId, id, dto.confirm);
  }

  @Patch('assignments/:id/notes')
  updateNote(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.judge.updateNote(req.user.userId, id, dto.content);
  }

  @Post('assignments/:id/bookmarks')
  toggleBookmark(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: ToggleBookmarkDto,
  ) {
    return this.judge.toggleBookmark(req.user.userId, id, dto.label);
  }

  @Get('rubric')
  rubric(@Req() req: AuthRequest) {
    return this.judge.getRubric(req.user.userId);
  }

  @Get('analytics')
  analytics(@Req() req: AuthRequest) {
    return this.judge.getAnalytics(req.user.userId);
  }

  @Post('assignments')
  createAssignment(@Req() req: AuthRequest, @Body() dto: CreateAssignmentDto) {
    return this.judge.createAssignment(req.user.userId, dto);
  }
}
