import { AUTOMATION_EVENTS } from '@hackos/shared';

export type AutomationEventType =
  (typeof AUTOMATION_EVENTS)[keyof typeof AUTOMATION_EVENTS];

export interface BaseAutomationEvent<T = Record<string, unknown>> {
  id: string;
  eventType: AutomationEventType;
  timestamp: string; // ISO 8601
  actorId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  payload: T;
}

// 1. Registration Events (Phase 2)
export interface RegistrationCreatedPayload {
  registrationId: string;
  userId: string;
  eventId: string;
  email: string;
  name: string;
  mode: 'ONSITE' | 'ONLINE' | 'HYBRID';
  appliedAt: string;
}

export interface RegistrationApprovedPayload {
  registrationId: string;
  userId: string;
  eventId: string;
  email: string;
  name: string;
  approvedBy: string;
  approvedAt: string;
}

export interface RegistrationRejectedPayload {
  registrationId: string;
  userId: string;
  eventId: string;
  email: string;
  reason?: string;
  rejectedBy: string;
  rejectedAt: string;
}

// 2. Team Events (Phase 4)
export interface TeamCreatedPayload {
  teamId: string;
  name: string;
  slug: string;
  leaderId: string;
  eventId?: string;
  createdAt: string;
}

export interface TeamMemberJoinedPayload {
  teamId: string;
  userId: string;
  role: 'MEMBER' | 'LEADER';
  joinedAt: string;
}

export interface TeamCompletedPayload {
  teamId: string;
  memberCount: number;
  completedAt: string;
}

// 3. Announcement Events (Phase 5)
export interface AnnouncementPublishedPayload {
  announcementId: string;
  eventId?: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience?: string[];
  publishedBy: string;
  publishedAt: string;
}

// 4. Transactional Email Events (Phase 3)
export interface EmailSendRequestedPayload {
  emailId: string;
  to: string;
  template: string;
  subject: string;
  templateVariables: Record<string, unknown>;
  retryAttempts?: number;
  requestedAt: string;
}

export interface EmailDeliveredPayload {
  emailId: string;
  to: string;
  providerMessageId?: string;
  deliveredAt: string;
}

export interface EmailFailedPayload {
  emailId: string;
  to: string;
  errorCode: string;
  errorMessage: string;
  retryCount: number;
  failedAt: string;
}

/**
 * Event Outbox & Bus Contract for reliable, idempotent background job execution (Phase 3 & beyond)
 */
export interface IAutomationEventBus {
  publish<T>(event: BaseAutomationEvent<T>): Promise<void>;
  subscribe<T>(
    eventType: AutomationEventType,
    handler: (event: BaseAutomationEvent<T>) => Promise<void>,
  ): void;
}
