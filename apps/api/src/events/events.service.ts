import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { DEFAULT_EVENT_SLUG } from '@hackos/shared';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCurrentEvent() {
    let event = null;
    try {
      event =
        (await this.prisma.event.findFirst({
          where: { isActive: true, isPublished: true },
          orderBy: { updatedAt: 'desc' },
        })) ||
        (await this.prisma.event.findUnique({
          where: { slug: DEFAULT_EVENT_SLUG },
        })) ||
        (await this.prisma.event.findFirst({
          where: { isActive: true },
        }));
    } catch (err) {
      console.warn(
        'EventsService: Database query failed, using safe fallback NIRAL configuration:',
        err instanceof Error ? err.message : String(err),
      );
    }

    if (!event) {
      // Safe fallback default NIRAL 2026 configuration
      return {
        id: 'niral-2026-default',
        name: 'NIRAL Hackathon 2026',
        slug: DEFAULT_EVENT_SLUG,
        publicDescription:
          'NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies hackathon bringing together students, researchers, makers, and innovators.',
        tagline: 'The Future of Innovation Starts Here',
        timezone: 'Asia/Kolkata',
        startsAt: new Date('2026-12-03T00:00:00.000Z').toISOString(),
        endsAt: new Date('2026-12-04T23:59:59.000Z').toISOString(),
        hasExactTimes: false,
        location: null,
        venueName: null,
        venueAddress: null,
        eventMode: 'HYBRID',
        registrationEnabled: false,
        minTeamSize: 2,
        maxTeamSize: 4,
        prizePool: null,
        status: 'DRAFT',
        isPublished: true,
        isActive: true,
      };
    }

    return event;
  }

  async getBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
    });
    if (!event) {
      throw new NotFoundException(`Event with slug '${slug}' was not found`);
    }
    return event;
  }

  async getAdminEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`Event '${id}' not found`);
    }
    return event;
  }

  async updateAdminEvent(id: string, dto: UpdateEventDto, actorId: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Event '${id}' not found`);
    }

    // Date validations
    const start = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const end = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (start && end && start > end) {
      throw new BadRequestException(
        'Event start date cannot be after the end date',
      );
    }

    const regStart = dto.registrationStartsAt
      ? new Date(dto.registrationStartsAt)
      : existing.registrationStartsAt;
    const regEnd = dto.registrationEndsAt
      ? new Date(dto.registrationEndsAt)
      : existing.registrationEndsAt;
    if (regStart && regEnd && regStart > regEnd) {
      throw new BadRequestException(
        'Registration opening date cannot be after registration deadline',
      );
    }

    // Team size validations
    const minTeam = dto.minTeamSize ?? existing.minTeamSize;
    const maxTeam = dto.maxTeamSize ?? existing.maxTeamSize;
    if (minTeam > maxTeam) {
      throw new BadRequestException(
        `Minimum team size (${minTeam}) cannot exceed maximum team size (${maxTeam})`,
      );
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.publicDescription !== undefined && {
          publicDescription: dto.publicDescription,
        }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.organizerName !== undefined && {
          organizerName: dto.organizerName,
        }),
        ...(dto.officialEmail !== undefined && {
          officialEmail: dto.officialEmail,
        }),
        ...(dto.contactPhone !== undefined && {
          contactPhone: dto.contactPhone,
        }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt && { endsAt: new Date(dto.endsAt) }),
        ...(dto.hasExactTimes !== undefined && {
          hasExactTimes: dto.hasExactTimes,
        }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.venueName !== undefined && { venueName: dto.venueName }),
        ...(dto.venueAddress !== undefined && {
          venueAddress: dto.venueAddress,
        }),
        ...(dto.eventMode && { eventMode: dto.eventMode }),
        ...(dto.registrationStartsAt !== undefined && {
          registrationStartsAt: dto.registrationStartsAt
            ? new Date(dto.registrationStartsAt)
            : null,
        }),
        ...(dto.registrationEndsAt !== undefined && {
          registrationEndsAt: dto.registrationEndsAt
            ? new Date(dto.registrationEndsAt)
            : null,
        }),
        ...(dto.registrationEnabled !== undefined && {
          registrationEnabled: dto.registrationEnabled,
        }),
        ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
        ...(dto.minTeamSize !== undefined && { minTeamSize: dto.minTeamSize }),
        ...(dto.maxTeamSize !== undefined && { maxTeamSize: dto.maxTeamSize }),
        ...(dto.prizePool !== undefined && { prizePool: dto.prizePool }),
        ...(dto.status && { status: dto.status }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
        ...(dto.settings !== undefined && {
          settings: dto.settings as Prisma.InputJsonValue,
        }),
      },
    });

    // Record non-sensitive changed fields in audit log
    await this.audit.record({
      userId: actorId,
      action: 'EVENT_SETTINGS_UPDATED',
      resource: 'event',
      metadata: {
        eventId: id,
        changedFields: Object.keys(dto),
      },
    });

    return updated;
  }
}
