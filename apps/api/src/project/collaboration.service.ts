import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DOCUMENT_TEMPLATES,
  WHITEBOARD_TEMPLATES,
} from '@hackos/shared';
import { KanbanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
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

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teams: TeamsService,
  ) {}

  private async resolveTeam(userId: string) {
    const team = await this.teams.getMyTeam(userId);
    if (!team) {
      throw new ForbiddenException(
        'Join or create a team to access the project workspace',
      );
    }
    return team;
  }

  async recordTimeline(
    teamId: string,
    actorId: string | null,
    eventType: string,
    title: string,
    opts?: {
      targetType?: string;
      targetId?: string;
      detail?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    try {
      await this.prisma.timelineEvent.create({
        data: {
          teamId,
          actorId: actorId ?? undefined,
          eventType,
          title,
          targetType: opts?.targetType,
          targetId: opts?.targetId,
          detail: opts?.detail,
          metadata: opts?.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch {
      // Timeline must not block primary flows
    }
  }

  // ── Whiteboards ──────────────────────────────────────────────

  async listWhiteboards(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.whiteboard.findMany({
      where: { teamId: team.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { objects: true } },
      },
    });
  }

  async getWhiteboard(userId: string, boardId: string) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        objects: { orderBy: [{ layer: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');
    return board;
  }

  async createWhiteboard(userId: string, dto: CreateWhiteboardDto) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.create({
      data: {
        teamId: team.id,
        title: dto.title,
        templateId: dto.templateId,
        createdById: userId,
      },
    });

    if (dto.templateId) {
      const template = WHITEBOARD_TEMPLATES.find((t) => t.id === dto.templateId);
      if (template) {
        await this.prisma.whiteboardObject.createMany({
          data: template.objects.map((obj, i) => ({
            boardId: board.id,
            objectType: obj.type,
            positionX: obj.x,
            positionY: obj.y,
            width: 140,
            height: 80,
            layer: i,
            properties: { label: obj.label },
          })),
        });
      }
    }

    await this.recordTimeline(team.id, userId, 'WHITEBOARD', `Created whiteboard "${board.title}"`, {
      targetType: 'whiteboard',
      targetId: board.id,
    });

    return this.getWhiteboard(userId, board.id);
  }

  async updateWhiteboard(
    userId: string,
    boardId: string,
    dto: UpdateWhiteboardDto,
  ) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Whiteboard not found');

    await this.prisma.whiteboard.update({
      where: { id: boardId },
      data: {
        title: dto.title,
        zoom: dto.zoom,
        gridMode: dto.gridMode,
        snapToGrid: dto.snapToGrid,
        pageIndex: dto.pageIndex,
      },
    });

    return this.getWhiteboard(userId, boardId);
  }

  async addObject(
    userId: string,
    boardId: string,
    dto: CreateWhiteboardObjectDto,
  ) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');

    const object = await this.prisma.whiteboardObject.create({
      data: {
        boardId,
        objectType: dto.objectType,
        positionX: dto.positionX ?? 100,
        positionY: dto.positionY ?? 100,
        width: dto.width ?? (dto.objectType === 'sticky' ? 180 : 140),
        height: dto.height ?? (dto.objectType === 'sticky' ? 140 : 80),
        rotation: dto.rotation ?? 0,
        layer: dto.layer ?? 0,
        properties: (dto.properties ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.prisma.whiteboard.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    });

    return object;
  }

  async updateObject(
    userId: string,
    boardId: string,
    objectId: string,
    dto: UpdateWhiteboardObjectDto,
  ) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');

    const existing = await this.prisma.whiteboardObject.findFirst({
      where: { id: objectId, boardId },
    });
    if (!existing) throw new NotFoundException('Object not found');

    return this.prisma.whiteboardObject.update({
      where: { id: objectId },
      data: {
        positionX: dto.positionX,
        positionY: dto.positionY,
        width: dto.width,
        height: dto.height,
        rotation: dto.rotation,
        layer: dto.layer,
        properties: dto.properties as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteObject(userId: string, boardId: string, objectId: string) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');

    const existing = await this.prisma.whiteboardObject.findFirst({
      where: { id: objectId, boardId },
    });
    if (!existing) throw new NotFoundException('Object not found');

    await this.prisma.whiteboardObject.delete({ where: { id: objectId } });
    return { deleted: true };
  }

  async convertStickyToTask(
    userId: string,
    boardId: string,
    objectId: string,
    dto: ConvertStickyDto,
  ) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');

    const object = await this.prisma.whiteboardObject.findFirst({
      where: { id: objectId, boardId },
    });
    if (!object || object.objectType !== 'sticky') {
      throw new NotFoundException('Sticky note not found');
    }

    const props = (object.properties as Record<string, unknown>) ?? {};
    const title =
      (typeof props.text === 'string' && props.text.trim()) ||
      (typeof props.label === 'string' && props.label.trim()) ||
      'Sticky note idea';

    const last = await this.prisma.projectTask.findFirst({
      where: { teamId: team.id },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    const task = await this.prisma.projectTask.create({
      data: {
        teamId: team.id,
        taskNumber: (last?.taskNumber ?? 0) + 1,
        title: title.slice(0, 200),
        description: typeof props.notes === 'string' ? props.notes : undefined,
        status: KanbanStatus.BACKLOG,
        priority: (dto.priority as 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL') ?? 'MEDIUM',
        labels: dto.labels ?? ['whiteboard'],
        reporterId: userId,
        assigneeId: typeof props.assigneeId === 'string' ? props.assigneeId : undefined,
      },
    });

    await this.prisma.whiteboardObject.update({
      where: { id: objectId },
      data: {
        properties: {
          ...props,
          convertedTaskId: task.id,
        } as Prisma.InputJsonValue,
      },
    });

    await this.recordTimeline(
      team.id,
      userId,
      'TASK',
      `Converted sticky note to task "${task.title}"`,
      { targetType: 'task', targetId: task.id },
    );

    return task;
  }

  async aiSuggest(userId: string, boardId: string, dto: AiWhiteboardPromptDto) {
    const team = await this.resolveTeam(userId);
    const board = await this.prisma.whiteboard.findFirst({
      where: { id: boardId, teamId: team.id },
    });
    if (!board) throw new NotFoundException('Whiteboard not found');

    const prompt = dto.prompt.toLowerCase();
    const suggestions: Array<{
      objectType: string;
      label: string;
      x: number;
      y: number;
      explanation: string;
    }> = [];

    const push = (
      objectType: string,
      label: string,
      x: number,
      y: number,
      explanation: string,
    ) => suggestions.push({ objectType, label, x, y, explanation });

    if (
      prompt.includes('warehouse') ||
      prompt.includes('iot') ||
      prompt.includes('sensor')
    ) {
      push('sensor', 'Sensors', 80, 160, 'Capture environmental / inventory data');
      push('esp32', 'Edge MCU', 260, 160, 'Local aggregation and MQTT publish');
      push('cloud', 'Cloud Sync', 440, 160, 'Store telemetry and run analytics');
      push('server', 'Dashboard', 620, 160, 'Operator visibility and alerts');
    } else if (prompt.includes('ai') || prompt.includes('vision') || prompt.includes('yolo')) {
      push('camera', 'Camera', 100, 140, 'Image / video capture');
      push('raspberry-pi', 'Edge Device', 280, 140, 'On-device inference');
      push('database', 'Model Store', 460, 140, 'Weights and datasets');
      push('cloud', 'Training Sync', 640, 140, 'Periodic model updates');
    } else if (prompt.includes('api') || prompt.includes('backend')) {
      push('user', 'Client', 100, 120, 'External consumers');
      push('api-gateway', 'API Gateway', 280, 120, 'Auth and routing');
      push('server', 'Services', 460, 120, 'Business logic');
      push('database', 'Database', 640, 120, 'Persistence');
    } else {
      push('sticky', 'Problem', 120, 100, 'Capture the core problem');
      push('sticky', 'Solution', 320, 100, 'Outline the proposed approach');
      push('sticky', 'Hardware', 120, 280, 'List required components');
      push('sticky', 'Software', 320, 280, 'List software workstreams');
    }

    await this.recordTimeline(
      team.id,
      userId,
      'AI',
      `AI whiteboard suggestions for "${dto.prompt.slice(0, 60)}"`,
      { targetType: 'whiteboard', targetId: boardId },
    );

    return {
      prompt: dto.prompt,
      suggestions,
      note: 'Suggestions are editable objects — review before accepting.',
    };
  }

  async applyAiSuggestions(
    userId: string,
    boardId: string,
    suggestions: Array<{
      objectType: string;
      label: string;
      x: number;
      y: number;
    }>,
  ) {
    const created = [];
    for (const [i, s] of suggestions.entries()) {
      const obj = await this.addObject(userId, boardId, {
        objectType: s.objectType,
        positionX: s.x,
        positionY: s.y,
        properties: {
          label: s.label,
          text: s.label,
          color: s.objectType === 'sticky' ? '#fef08a' : undefined,
        },
        layer: i,
      });
      created.push(obj);
    }
    return created;
  }

  // ── Documents ────────────────────────────────────────────────

  async listDocuments(userId: string, category?: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.teamDocument.findMany({
      where: {
        teamId: team.id,
        ...(category
          ? { category: category as Prisma.EnumDocumentCategoryFilter['equals'] }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { links: true } },
      },
    });
  }

  async getDocument(userId: string, documentId: string) {
    const team = await this.resolveTeam(userId);
    const doc = await this.prisma.teamDocument.findFirst({
      where: { id: documentId, teamId: team.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        links: true,
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async createDocument(userId: string, dto: CreateDocumentDto) {
    const team = await this.resolveTeam(userId);
    let content = dto.content ?? '';
    let category = dto.category;

    if (dto.templateId) {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === dto.templateId);
      if (template) {
        content = template.content;
        category = template.category as typeof category;
      }
    }

    const doc = await this.prisma.teamDocument.create({
      data: {
        teamId: team.id,
        title: dto.title,
        category: category ?? 'TECHNICAL',
        content,
        templateId: dto.templateId,
        createdById: userId,
      },
    });

    await this.recordTimeline(
      team.id,
      userId,
      'DOCUMENT',
      `Created document "${doc.title}"`,
      { targetType: 'document', targetId: doc.id },
    );

    return doc;
  }

  async updateDocument(
    userId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.teamDocument.findFirst({
      where: { id: documentId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Document not found');

    const doc = await this.prisma.teamDocument.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        category: dto.category,
        status: dto.status,
        content: dto.content,
      },
      include: { links: true },
    });

    await this.recordTimeline(
      team.id,
      userId,
      'DOCUMENT',
      `Updated document "${doc.title}"`,
      { targetType: 'document', targetId: doc.id },
    );

    return doc;
  }

  async addDocumentLink(
    userId: string,
    documentId: string,
    dto: CreateDocumentLinkDto,
  ) {
    const team = await this.resolveTeam(userId);
    const doc = await this.prisma.teamDocument.findFirst({
      where: { id: documentId, teamId: team.id },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.documentLink.create({
      data: {
        documentId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        label: dto.label,
      },
    });
  }

  async deleteDocumentLink(userId: string, documentId: string, linkId: string) {
    const team = await this.resolveTeam(userId);
    const doc = await this.prisma.teamDocument.findFirst({
      where: { id: documentId, teamId: team.id },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const link = await this.prisma.documentLink.findFirst({
      where: { id: linkId, documentId },
    });
    if (!link) throw new NotFoundException('Link not found');

    await this.prisma.documentLink.delete({ where: { id: linkId } });
    return { deleted: true };
  }

  async aiDocumentAssist(
    userId: string,
    documentId: string,
    action: string,
  ) {
    const doc = await this.getDocument(userId, documentId);
    const team = await this.resolveTeam(userId);

    let suggestion = '';
    switch (action) {
      case 'summarize':
        suggestion = `## Summary\n\n${doc.title} covers ${doc.category.toLowerCase()} topics. Key sections should highlight problem, approach, and outcomes.\n\n_(Edit before accepting)_`;
        break;
      case 'headings':
        suggestion = `## Suggested headings\n\n- Overview\n- Problem Statement\n- Approach\n- Architecture\n- Risks\n- Next Steps\n`;
        break;
      case 'expand':
        suggestion = `${doc.content}\n\n## Expanded notes\n\nProvide more detail on implementation trade-offs, constraints, and validation criteria for the hackathon timeline.\n`;
        break;
      case 'grammar':
        suggestion = doc.content
          .replace(/\biot\b/gi, 'IoT')
          .replace(/\bapi\b/gi, 'API')
          .replace(/\s{2,}/g, ' ');
        break;
      default:
        suggestion = doc.content;
    }

    await this.recordTimeline(
      team.id,
      userId,
      'AI',
      `AI documentation assist (${action}) on "${doc.title}"`,
      { targetType: 'document', targetId: documentId },
    );

    return { action, suggestion, editable: true };
  }

  // ── Timeline ─────────────────────────────────────────────────

  async listTimeline(userId: string, query: TimelineQueryDto) {
    const team = await this.resolveTeam(userId);
    const where: Prisma.TimelineEventWhereInput = { teamId: team.id };

    if (query.eventType) where.eventType = query.eventType;
    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { detail: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const events = await this.prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { id: true, name: true } } },
    });

    return events;
  }

  async timelineAnalytics(userId: string) {
    const team = await this.resolveTeam(userId);
    const events = await this.prisma.timelineEvent.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'asc' },
      select: { eventType: true, createdAt: true, actorId: true },
    });

    const byType: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const e of events) {
      byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
      const hour = String(e.createdAt.getHours()).padStart(2, '0');
      byHour[hour] = (byHour[hour] ?? 0) + 1;
      const day = e.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEvents: events.length,
      byType,
      byDay,
      insights: {
        mostActiveHour: peakHour
          ? `${peakHour[0]}:00 (${peakHour[1]} events)`
          : 'No data yet',
        mostActiveDay: peakDay
          ? `${peakDay[0]} (${peakDay[1]} events)`
          : 'No data yet',
        documentationFrequency: byType.DOCUMENT ?? 0,
        taskThroughput: byType.TASK ?? 0,
        whiteboardActivity: byType.WHITEBOARD ?? 0,
        note: 'Insights support reflection and planning — not individual evaluation.',
      },
    };
  }

  async seedCollaborationDemo(userId: string) {
    const team = await this.resolveTeam(userId);

    const boardCount = await this.prisma.whiteboard.count({
      where: { teamId: team.id },
    });
    if (boardCount === 0) {
      await this.createWhiteboard(userId, {
        title: 'System Architecture V1',
        templateId: 'iot-gateway',
      });
    }

    const docCount = await this.prisma.teamDocument.count({
      where: { teamId: team.id },
    });
    if (docCount === 0) {
      await this.createDocument(userId, {
        title: 'Project Proposal',
        templateId: 'project-proposal',
      });
      await this.createDocument(userId, {
        title: 'System Architecture',
        templateId: 'system-architecture',
      });
    }

    await this.recordTimeline(team.id, userId, 'TEAM', 'Collaboration workspace seeded', {
      detail: 'Demo whiteboards and documents ready',
    });

    return { seeded: true };
  }
}
