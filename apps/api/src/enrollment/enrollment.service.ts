import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { EnrollEventDto } from './dto/enroll.dto';
import { money, requireFeeScope } from '../payments/payment-rules';
@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}
  async getActiveEvent() {
    const event = await this.prisma.event.findFirst({
      where: { isActive: true, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!event) return null;
    const settings = (event.settings ?? {}) as Record<string, unknown>;
    return {
      ...event,
      settings: {
        studentIdRequired: settings.studentIdRequired === true,
        eligibilityText:
          typeof settings.eligibilityText === 'string'
            ? settings.eligibilityText
            : undefined,
        rulesText:
          typeof settings.rulesText === 'string'
            ? settings.rulesText
            : undefined,
        tracks: Array.isArray(settings.tracks)
          ? settings.tracks.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
      },
    };
  }
  async myEnrollment(userId: string) {
    const event = await this.getActiveEvent();
    if (!event) return { event: null, enrollment: null, announcement: null };
    const [enrollment, announcement] = await Promise.all([
      this.prisma.eventEnrollment.findUnique({
        where: { userId_eventId: { userId, eventId: event.id } },
      }),
      this.prisma.announcement.findFirst({
        where: { eventId: event.id, published: true },
        orderBy: { createdAt: 'desc' },
        select: { title: true, body: true, createdAt: true },
      }),
    ]);
    return { event, enrollment, announcement };
  }
  async enroll(userId: string, dto: EnrollEventDto) {
    if (
      !dto.rulesAccepted ||
      !dto.eligibilityConfirmed ||
      !dto.privacyAccepted ||
      !dto.codeOfConductAccepted ||
      !dto.application
    )
      throw new BadRequestException(
        'Review your application and accept the declaration.',
      );
    const active = dto.eventId ? null : await this.getActiveEvent();
    const eventId = dto.eventId ?? active?.id;
    if (!eventId) throw new NotFoundException('No published event available');
    let result: Awaited<ReturnType<typeof this.persist>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await this.persist(userId, eventId, dto);
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new ConflictException(
            'An application already exists for this event. View your application status.',
          );
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        )
          continue;
        throw error;
      }
    }
    if (!result)
      throw new ConflictException(
        'Application changed concurrently. Please retry.',
      );
    const confirmed = result.enrollment.status === 'CONFIRMED';
    const delivery = await this.mail
      .send({
        to: result.email,
        subject: confirmed
          ? 'NIRAL registration confirmed'
          : 'NIRAL enrollment pending payment',
        eventType: confirmed ? 'registration.confirmed' : 'payment.pending',
        html: `<p>${confirmed ? 'Your free event enrollment is confirmed.' : 'Your event enrollment is pending verified payment. Do not pay twice if a result is delayed.'} Registration reference: <strong>${result.enrollment.registrationId}</strong>.</p>`,
      })
      .catch(() => ({ success: false }));
    if (delivery.success)
      await this.prisma.paymentNotification
        .updateMany({
          where: { deduplicationKey: `enrollment:${result.enrollment.id}` },
          data: { status: 'SENT', sentAt: new Date() },
        })
        .catch(() => undefined);
    return {
      ...result.enrollment,
      emailDelivery: delivery.success ? 'accepted' : 'failed',
    };
  }
  async transition(id: string, status: EnrollmentStatus, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({ where: { id: actorId } });
      if (
        !actor ||
        !['ADMIN', 'ORGANIZER'].includes(actor.role) ||
        actor.accountStatus !== 'ACTIVE'
      )
        throw new ForbiddenException('Organizer authorization required.');
      const record = await tx.eventEnrollment.findUnique({ where: { id } });
      if (!record) throw new NotFoundException('Application not found');
      if (status === 'CONFIRMED' && record.paymentModeSnapshot === 'PAID') {
        const payment = await tx.paymentOrder.findUnique({
          where: { enrollmentId: id },
        });
        if (!payment || payment.status !== 'CAPTURED')
          throw new ConflictException(
            'Paid enrollment requires a verified captured payment.',
          );
      }
      const allowed: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN'],
        WAITLISTED: ['CONFIRMED', 'REJECTED', 'WITHDRAWN'],
        CONFIRMED: ['WITHDRAWN'],
        REJECTED: [],
        WITHDRAWN: [],
      };
      if (!allowed[record.status]?.includes(status))
        throw new ConflictException(
          'This application status transition is not permitted.',
        );
      const changed = await tx.eventEnrollment.updateMany({
        where: { id, status: record.status },
        data: { status, confirmationStatus: status },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Application status changed. Refresh and retry.',
        );
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'EVENT_APPLICATION_STATUS_CHANGED',
          resource: 'event',
          metadata: {
            enrollmentId: id,
            eventId: record.eventId,
            from: record.status,
            to: status,
          },
        },
      });
      await tx.notification.create({
        data: {
          userId: record.userId,
          title: 'Application status updated',
          body: `Your application status is now ${status}.`,
          type: 'info',
          link: '/dashboard/application',
        },
      });
      return tx.eventEnrollment.findUnique({ where: { id } });
    });
  }

  private async persist(userId: string, eventId: string, dto: EnrollEventDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user?.emailVerified || user.accountStatus !== 'ACTIVE')
          throw new ForbiddenException(
            'A verified active account is required.',
          );
        if (!['PARTICIPANT', 'TEAM_LEADER'].includes(user.role))
          throw new ForbiddenException(
            'Only participant accounts can submit applications.',
          );
        const event = await tx.event.findUnique({ where: { id: eventId } });
        const now = new Date();
        if (!event || !event.isActive || !event.isPublished)
          throw new NotFoundException('No published event available');
        if (event.registrationPaymentMode === 'DISABLED')
          throw new BadRequestException(
            'Event enrollment is disabled. Account access remains available.',
          );
        if (event.registrationPaymentMode === 'PAID') {
          requireFeeScope(event.feeScope);
          if (
            !event.feeApprovedAt ||
            !event.feeAmountMinor ||
            !event.receiptIssuer ||
            !event.paymentPolicyUrl ||
            !event.refundPolicyUrl ||
            !event.cancellationPolicyUrl ||
            event.feeCurrency !== 'INR'
          )
            throw new BadRequestException(
              'The official payment terms have not been approved and configured.',
            );
          money(event.feeAmountMinor + event.taxAmountMinor);
        }
        if (
          !event.registrationEnabled ||
          event.status !== 'REGISTRATION_OPEN' ||
          (event.registrationStartsAt && event.registrationStartsAt > now) ||
          (event.registrationEndsAt && event.registrationEndsAt < now)
        )
          throw new BadRequestException(
            'Registration is not open for this event.',
          );
        const settings = (event.settings ?? {}) as Record<string, unknown>;
        if (
          settings.studentIdRequired === true &&
          !dto.application.studentId?.trim()
        )
          throw new BadRequestException(
            'Student ID is required by this event policy.',
          );
        if (
          !dto.application.yearOfStudy?.trim() ||
          !dto.application.phone?.trim()
        )
          throw new BadRequestException(
            'Academic year and contact number are required.',
          );
        if (settings.registrationOpen === false)
          throw new BadRequestException('Registration is closed.');
        if (
          (event.eventMode === 'OFFLINE' && dto.mode !== 'ONSITE') ||
          (event.eventMode === 'ONLINE' && dto.mode !== 'ONLINE')
        )
          throw new BadRequestException(
            'Choose a participation mode supported by this event.',
          );
        const existing = await tx.eventEnrollment.findUnique({
          where: { userId_eventId: { userId, eventId } },
        });
        if (existing)
          throw new ConflictException(
            'An application already exists. View your application status.',
          );
        if (event.maxCapacity !== null) {
          const count = await tx.eventEnrollment.count({
            where: { eventId, status: { in: ['PENDING', 'CONFIRMED'] } },
          });
          if (count >= event.maxCapacity)
            throw new ConflictException(
              'Event application capacity has been reached.',
            );
        }
        const enrollment = await tx.eventEnrollment.create({
          data: {
            userId,
            eventId,
            registrationId: `NIRAL-${randomBytes(8).toString('hex').toUpperCase()}`,
            mode: dto.mode,
            rulesAccepted: true,
            eligibilityConfirmed: true,
            status:
              event.registrationPaymentMode === 'FREE'
                ? 'CONFIRMED'
                : 'PENDING',
            confirmationStatus:
              event.registrationPaymentMode === 'FREE'
                ? 'CONFIRMED'
                : 'PAYMENT_PENDING',
            paymentModeSnapshot: event.registrationPaymentMode,
            paymentProviderSnapshot: event.paymentProvider,
            feeScopeSnapshot: event.feeScope,
            feeAmountSnapshot:
              event.registrationPaymentMode === 'PAID'
                ? event.feeAmountMinor!
                : 0,
            taxAmountSnapshot:
              event.registrationPaymentMode === 'PAID'
                ? event.taxAmountMinor
                : 0,
            feeCurrencySnapshot: event.feeCurrency,
            paymentPolicySnapshot: {
              eventName: event.name,
              receiptIssuer: event.receiptIssuer,
              paymentPolicyUrl: event.paymentPolicyUrl,
              refundPolicyUrl: event.refundPolicyUrl,
              cancellationPolicyUrl: event.cancellationPolicyUrl,
              minTeamSize: event.minTeamSize,
              maxTeamSize: event.maxTeamSize,
              feeScope: event.feeScope,
              version: event.paymentSettingsVersion,
            },
            privacyAccepted: true,
            codeOfConductAccepted: true,
            applicationData: {
              ...dto.application,
              name: user.name,
              email: user.email,
            },
            consentAcceptedAt: now,
            consentVersion: `event:${event.id}:rules:${event.updatedAt.toISOString()}`,
          },
        });
        await tx.paymentNotification.create({
          data: {
            deduplicationKey: `enrollment:${enrollment.id}`,
            nextAttemptAt: new Date(Date.now() + 120000),
            userId,
            eventType:
              enrollment.status === 'CONFIRMED'
                ? 'registration.confirmed'
                : 'enrollment.pending',
            subject:
              enrollment.status === 'CONFIRMED'
                ? 'NIRAL registration confirmed'
                : 'NIRAL enrollment pending payment',
            body: `Registration reference ${enrollment.registrationId}. ${enrollment.status === 'CONFIRMED' ? 'Your free event enrollment is confirmed.' : 'Your event enrollment is pending verified payment. Check your dashboard before retrying payment.'}`,
          },
        });
        await tx.userProfile.upsert({
          where: { userId },
          create: {
            userId,
            institution: dto.application.institution,
            department: dto.application.department,
            degree: dto.application.degree,
            yearOfStudy: dto.application.yearOfStudy,
            phoneNumber: dto.application.phone,
          },
          update: {
            institution: dto.application.institution,
            department: dto.application.department,
            degree: dto.application.degree,
            yearOfStudy: dto.application.yearOfStudy,
            phoneNumber: dto.application.phone,
          },
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'EVENT_APPLICATION_SUBMITTED',
            resource: 'event',
            metadata: {
              eventId,
              enrollmentId: enrollment.id,
              from: null,
              to: enrollment.status,
              consentVersion: enrollment.consentVersion,
            },
          },
        });
        await tx.notification.create({
          data: {
            userId,
            title:
              enrollment.status === 'CONFIRMED'
                ? 'Registration confirmed'
                : 'Enrollment pending payment',
            body:
              enrollment.status === 'CONFIRMED'
                ? 'Your free event enrollment is confirmed.'
                : 'Complete verified payment to confirm event enrollment.',
            type: 'info',
            link: '/dashboard/application',
          },
        });
        return { enrollment, email: user.email };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
