/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

describe('EventsService & Event Configuration (Phase 1 Integration)', () => {
  let service: EventsService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    mockPrisma.auditLog = {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };
    mockPrisma.$transaction = jest.fn((fn: (tx: any) => unknown) =>
      fn(mockPrisma),
    );
    service = new EventsService(mockPrisma, mockAudit);
  });

  describe('getCurrentEvent', () => {
    it('does not invent an event when no published record exists', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);
      expect(await service.getCurrentEvent()).toBeNull();
    });

    it('returns authoritative event from database when present', async () => {
      const dbEvent = {
        id: 'event-123',
        name: 'NIRAL Hackathon 2026',
        slug: 'niral-2026',
        tagline: 'Custom Tagline',
        startsAt: new Date('2026-12-03T00:00:00.000Z'),
        endsAt: new Date('2026-12-04T23:59:59.000Z'),
        timezone: 'Asia/Kolkata',
        hasExactTimes: false,
        isActive: true,
        isPublished: true,
      };

      mockPrisma.event.findFirst.mockResolvedValue(dbEvent);

      const result = await service.getCurrentEvent();
      expect(result).toEqual(dbEvent);
      expect(result!.name).toBe('NIRAL Hackathon 2026');
    });

    it('reports database failure rather than inventing a healthy event', async () => {
      mockPrisma.event.findFirst.mockRejectedValue(
        new Error('Connection refused'),
      );
      await expect(service.getCurrentEvent()).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('updateAdminEvent validations', () => {
    const existingEvent = {
      id: 'event-1',
      name: 'NIRAL Hackathon 2026',
      startsAt: new Date('2026-12-03T00:00:00.000Z'),
      endsAt: new Date('2026-12-04T23:59:59.000Z'),
      registrationStartsAt: new Date('2026-11-01T00:00:00.000Z'),
      registrationEndsAt: new Date('2026-11-25T00:00:00.000Z'),
      minTeamSize: 2,
      maxTeamSize: 4,
    };

    it('throws BadRequestException if start date is after end date', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(existingEvent);

      await expect(
        service.updateAdminEvent(
          'event-1',
          {
            startsAt: '2026-12-05T00:00:00.000Z',
            endsAt: '2026-12-02T00:00:00.000Z',
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if registration start is after deadline', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(existingEvent);

      await expect(
        service.updateAdminEvent(
          'event-1',
          {
            registrationStartsAt: '2026-11-30T00:00:00.000Z',
            registrationEndsAt: '2026-11-10T00:00:00.000Z',
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if minTeamSize > maxTeamSize', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(existingEvent);

      await expect(
        service.updateAdminEvent(
          'event-1',
          {
            minTeamSize: 5,
            maxTeamSize: 3,
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully updates event and logs an audit record', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(existingEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...existingEvent,
        tagline: 'New Verified Tagline',
      });

      const result = await service.updateAdminEvent(
        'event-1',
        { tagline: 'New Verified Tagline' },
        'admin-user-id',
      );

      expect(mockPrisma.event.update).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'admin-user-id',
            action: 'EVENT_SETTINGS_UPDATED',
            resource: 'event',
          }) as unknown,
        }),
      );
      expect(result.tagline).toBe('New Verified Tagline');
    });

    it('throws NotFoundException when event id does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAdminEvent(
          'non-existent-id',
          { name: 'Test' },
          'actor-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
