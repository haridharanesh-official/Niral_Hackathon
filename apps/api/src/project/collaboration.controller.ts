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
import { CollaborationService } from './collaboration.service';
import {
  AiWhiteboardPromptDto,
  ConvertStickyDto,
  CreateDocumentDto,
  CreateDocumentLinkDto,
  CreateWhiteboardDto,
  CreateWhiteboardObjectDto,
  TimelineQueryDto,
  UpdateDocumentDto,
  UpdateWhiteboardDto,
  UpdateWhiteboardObjectDto,
} from './dto/collaboration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = Request & { user: { userId: string } };

@Controller('project/collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collab: CollaborationService) {}

  // Whiteboards
  @Get('whiteboards')
  listBoards(@Req() req: AuthRequest) {
    return this.collab.listWhiteboards(req.user.userId);
  }

  @Post('whiteboards')
  createBoard(@Req() req: AuthRequest, @Body() dto: CreateWhiteboardDto) {
    return this.collab.createWhiteboard(req.user.userId, dto);
  }

  @Get('whiteboards/:id')
  getBoard(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.collab.getWhiteboard(req.user.userId, id);
  }

  @Patch('whiteboards/:id')
  updateBoard(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWhiteboardDto,
  ) {
    return this.collab.updateWhiteboard(req.user.userId, id, dto);
  }

  @Post('whiteboards/:id/objects')
  addObject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateWhiteboardObjectDto,
  ) {
    return this.collab.addObject(req.user.userId, id, dto);
  }

  @Patch('whiteboards/:id/objects/:objectId')
  updateObject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('objectId') objectId: string,
    @Body() dto: UpdateWhiteboardObjectDto,
  ) {
    return this.collab.updateObject(req.user.userId, id, objectId, dto);
  }

  @Delete('whiteboards/:id/objects/:objectId')
  deleteObject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('objectId') objectId: string,
  ) {
    return this.collab.deleteObject(req.user.userId, id, objectId);
  }

  @Post('whiteboards/:id/objects/:objectId/to-task')
  convertSticky(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('objectId') objectId: string,
    @Body() dto: ConvertStickyDto,
  ) {
    return this.collab.convertStickyToTask(req.user.userId, id, objectId, dto);
  }

  @Post('whiteboards/:id/ai-suggest')
  aiSuggest(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AiWhiteboardPromptDto,
  ) {
    return this.collab.aiSuggest(req.user.userId, id, dto);
  }

  @Post('whiteboards/:id/ai-apply')
  aiApply(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { suggestions: Array<{ objectType: string; label: string; x: number; y: number }> },
  ) {
    return this.collab.applyAiSuggestions(req.user.userId, id, body.suggestions);
  }

  // Documents
  @Get('documents')
  listDocs(@Req() req: AuthRequest, @Query('category') category?: string) {
    return this.collab.listDocuments(req.user.userId, category);
  }

  @Post('documents')
  createDoc(@Req() req: AuthRequest, @Body() dto: CreateDocumentDto) {
    return this.collab.createDocument(req.user.userId, dto);
  }

  @Get('documents/:id')
  getDoc(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.collab.getDocument(req.user.userId, id);
  }

  @Patch('documents/:id')
  updateDoc(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.collab.updateDocument(req.user.userId, id, dto);
  }

  @Post('documents/:id/links')
  addLink(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateDocumentLinkDto,
  ) {
    return this.collab.addDocumentLink(req.user.userId, id, dto);
  }

  @Delete('documents/:id/links/:linkId')
  deleteLink(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('linkId') linkId: string,
  ) {
    return this.collab.deleteDocumentLink(req.user.userId, id, linkId);
  }

  @Post('documents/:id/ai-assist')
  aiDocAssist(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { action: string },
  ) {
    return this.collab.aiDocumentAssist(req.user.userId, id, body.action);
  }

  // Timeline
  @Get('timeline')
  timeline(@Req() req: AuthRequest, @Query() query: TimelineQueryDto) {
    return this.collab.listTimeline(req.user.userId, query);
  }

  @Get('timeline/analytics')
  timelineAnalytics(@Req() req: AuthRequest) {
    return this.collab.timelineAnalytics(req.user.userId);
  }

  @Post('seed-demo')
  seedDemo(@Req() req: AuthRequest) {
    return this.collab.seedCollaborationDemo(req.user.userId);
  }
}
