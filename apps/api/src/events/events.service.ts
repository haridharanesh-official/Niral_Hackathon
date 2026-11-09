import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCurrentEvent() {
    return this.prisma.event.findFirst({
      where: { isActive: true, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    });
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

    const regStart =
      dto.registrationStartsAt === undefined
        ? existing.registrationStartsAt
        : dto.registrationStartsAt
          ? new Date(dto.registrationStartsAt)
          : null;
    const regEnd =
      dto.registrationEndsAt === undefined
        ? existing.registrationEndsAt
        : dto.registrationEndsAt
          ? new Date(dto.registrationEndsAt)
          : null;
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
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
          ...(dto.maxCapacity !== undefined && {
            maxCapacity: dto.maxCapacity,
          }),
          ...(dto.minTeamSize !== undefined && {
            minTeamSize: dto.minTeamSize,
          }),
          ...(dto.maxTeamSize !== undefined && {
            maxTeamSize: dto.maxTeamSize,
          }),
          ...(dto.prizePool !== undefined && { prizePool: dto.prizePool }),
          ...(dto.status && { status: dto.status }),
          ...(dto.isPublished !== undefined && {
            isPublished: dto.isPublished,
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
          ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
          ...(dto.settings !== undefined && {
            settings: dto.settings as Prisma.InputJsonValue,
          }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'EVENT_SETTINGS_UPDATED',
          resource: 'event',
          metadata: { eventId: id, changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });
  }
}
