import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProjectService } from './project.service';
import {
  CreateAttachmentDto,
  CreateChecklistItemDto,
  CreateCommentDto,
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = Request & { user: { userId: string } };

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly project: ProjectService) {}

  @Get('workspace')
  workspace(@Req() req: AuthRequest) {
    return this.project.workspace(req.user.userId);
  }

  @Get('tasks')
  listTasks(@Req() req: AuthRequest, @Query() query: TaskQueryDto) {
    return this.project.listTasks(req.user.userId, query);
  }

  @Get('tasks/:id')
  getTask(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.project.getTask(req.user.userId, id);
  }

  @Post('tasks')
  createTask(@Req() req: AuthRequest, @Body() dto: CreateTaskDto) {
    return this.project.createTask(req.user.userId, dto);
  }

  @Patch('tasks/:id')
  updateTask(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.project.updateTask(req.user.userId, id, dto);
  }

  @Patch('tasks/:id/move')
  moveTask(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.project.moveTask(req.user.userId, id, dto);
  }

  @Post('tasks/:id/comments')
  addComment(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.project.addComment(req.user.userId, id, dto);
  }

  @Post('tasks/:id/checklist')
  addChecklistItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.project.addChecklistItem(req.user.userId, id, dto);
  }

  @Patch('tasks/:id/checklist/:itemId')
  updateChecklistItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.project.updateChecklistItem(req.user.userId, id, itemId, dto);
  }

  @Delete('tasks/:id/checklist/:itemId')
  deleteChecklistItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.project.deleteChecklistItem(req.user.userId, id, itemId);
  }

  @Post('tasks/:id/attachments')
  addAttachment(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.project.addAttachment(req.user.userId, id, dto);
  }

  @Post('seed-demo')
  seedDemo(@Req() req: AuthRequest) {
    return this.project.seedDemoTasks(req.user.userId);
  }
}
