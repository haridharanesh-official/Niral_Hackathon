import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollEventDto } from './dto/enroll.dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveEvent() {
    return this.prisma.event.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async myEnrollment(userId: string) {
    const event = await this.getActiveEvent();
    if (!event) return { event: null, enrollment: null };

    const enrollment = await this.prisma.eventEnrollment.findUnique({
      where: {
        userId_eventId: { userId, eventId: event.id },
      },
    });

    return { event, enrollment };
  }

  async enroll(userId: string, dto: EnrollEventDto) {
    if (!dto.rulesAccepted || !dto.eligibilityConfirmed) {
      throw new BadRequestException(
        'You must accept event rules and confirm eligibility',
      );
    }

    const event =
      (dto.eventId
        ? await this.prisma.event.findUnique({ where: { id: dto.eventId } })
        : await this.getActiveEvent()) ?? null;

    if (!event) throw new NotFoundException('No active event found');

    const settings = (event.settings as Record<string, unknown> | null) ?? {};
    if (settings.registrationOpen === false) {
      throw new BadRequestException('Registration is closed for this event');
    }

    const existing = await this.prisma.eventEnrollment.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
    });
    if (existing && existing.status === 'CONFIRMED') {
      throw new ConflictException('Already enrolled in this event');
    }

    const registrationId = this.makeRegistrationId(event.slug);

    const enrollment = existing
      ? await this.prisma.eventEnrollment.update({
          where: { id: existing.id },
          data: {
            mode: dto.mode,
            rulesAccepted: true,
            eligibilityConfirmed: true,
            status: 'CONFIRMED',
            registrationId,
          },
          include: { event: true },
        })
      : await this.prisma.eventEnrollment.create({
          data: {
            userId,
            eventId: event.id,
            mode: dto.mode,
            rulesAccepted: true,
            eligibilityConfirmed: true,
            status: 'CONFIRMED',
            registrationId,
          },
          include: { event: true },
        });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Event registration confirmed',
        body: `You are registered for ${event.name}. ID: ${registrationId}`,
        type: 'success',
        link: '/dashboard/enrollment',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'EVENT_ENROLLED',
        resource: 'event',
        metadata: { eventId: event.id, registrationId },
      },
    });

    return enrollment;
  }

  private makeRegistrationId(slug: string) {
    const prefix = slug.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'H');
    const suffix = createHash('sha1')
      .update(randomBytes(8))
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    return `HOS-${prefix}-${suffix}`;
  }
}
