import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ExecutionService } from './execution.service';
import {
  AssignSprintTasksDto,
  CreateDeliverableDto,
  CreateDependencyDto,
  CreateIssueDto,
  CreateMilestoneDto,
  CreateRiskDto,
  CreateSprintDto,
  SprintRetrospectiveDto,
  SprintReviewDto,
  UpdateDeliverableDto,
  UpdateIssueDto,
  UpdateMilestoneDto,
  UpdateRiskDto,
  UpdateSprintDto,
} from './dto/execution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = Request & { user: { userId: string } };

@Controller('project/execution')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly execution: ExecutionService) {}

  @Get('dashboard')
  dashboard(@Req() req: AuthRequest) {
    return this.execution.executionDashboard(req.user.userId);
  }

  @Get('sprints')
  listSprints(@Req() req: AuthRequest) {
    return this.execution.listSprints(req.user.userId);
  }

  @Post('sprints')
  createSprint(@Req() req: AuthRequest, @Body() dto: CreateSprintDto) {
    return this.execution.createSprint(req.user.userId, dto);
  }

  @Get('sprints/:id')
  getSprint(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.execution.getSprint(req.user.userId, id);
  }

  @Patch('sprints/:id')
  updateSprint(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.execution.updateSprint(req.user.userId, id, dto);
  }

  @Post('sprints/:id/activate')
  activateSprint(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.execution.activateSprint(req.user.userId, id);
  }

  @Post('sprints/:id/tasks')
  assignTasks(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AssignSprintTasksDto,
  ) {
    return this.execution.assignTasksToSprint(req.user.userId, id, dto);
  }

  @Post('sprints/:id/review')
  sprintReview(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SprintReviewDto,
  ) {
    return this.execution.recordSprintReview(req.user.userId, id, dto);
  }

  @Post('sprints/:id/retrospective')
  sprintRetro(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SprintRetrospectiveDto,
  ) {
    return this.execution.recordSprintRetrospective(req.user.userId, id, dto);
  }

  @Get('milestones')
  listMilestones(@Req() req: AuthRequest) {
    return this.execution.listMilestones(req.user.userId);
  }

  @Post('milestones')
  createMilestone(@Req() req: AuthRequest, @Body() dto: CreateMilestoneDto) {
    return this.execution.createMilestone(req.user.userId, dto);
  }

  @Patch('milestones/:id')
  updateMilestone(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.execution.updateMilestone(req.user.userId, id, dto);
  }

  @Post('milestones/seed')
  seedMilestones(@Req() req: AuthRequest) {
    return this.execution.seedMilestones(req.user.userId);
  }

  @Get('deliverables')
  listDeliverables(@Req() req: AuthRequest) {
    return this.execution.listDeliverables(req.user.userId);
  }

  @Post('deliverables')
  createDeliverable(
    @Req() req: AuthRequest,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.execution.createDeliverable(req.user.userId, dto);
  }

  @Patch('deliverables/:id')
  updateDeliverable(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.execution.updateDeliverable(req.user.userId, id, dto);
  }

  @Get('dependencies')
  listDependencies(@Req() req: AuthRequest) {
    return this.execution.listDependencies(req.user.userId);
  }

  @Post('dependencies')
  createDependency(
    @Req() req: AuthRequest,
    @Body() dto: CreateDependencyDto,
  ) {
    return this.execution.createDependency(req.user.userId, dto);
  }

  @Delete('dependencies/:id')
  deleteDependency(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.execution.deleteDependency(req.user.userId, id);
  }

  @Get('risks')
  listRisks(@Req() req: AuthRequest) {
    return this.execution.listRisks(req.user.userId);
  }

  @Post('risks')
  createRisk(@Req() req: AuthRequest, @Body() dto: CreateRiskDto) {
    return this.execution.createRisk(req.user.userId, dto);
  }

  @Patch('risks/:id')
  updateRisk(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.execution.updateRisk(req.user.userId, id, dto);
  }

  @Get('issues')
  listIssues(@Req() req: AuthRequest) {
    return this.execution.listIssues(req.user.userId);
  }

  @Post('issues')
  createIssue(@Req() req: AuthRequest, @Body() dto: CreateIssueDto) {
    return this.execution.createIssue(req.user.userId, dto);
  }

  @Patch('issues/:id')
  updateIssue(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.execution.updateIssue(req.user.userId, id, dto);
  }

  @Post('seed-demo')
  seedDemo(@Req() req: AuthRequest) {
    return this.execution.seedExecutionDemo(req.user.userId);
  }
}
