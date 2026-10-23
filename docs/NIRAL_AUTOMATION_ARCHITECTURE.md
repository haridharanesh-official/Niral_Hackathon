# NIRAL Hackathon 2026 — Automation Engine Architecture

This document specifies the event-driven automation and transactional messaging architecture established in Phase 1 to support Phases 2 through 5.

---

## 1. System Vision & Event-Driven Topology

NIRAL 2026 automates participant approvals, transactional emails, team formation milestones, live announcements, and QR attendance. To guarantee fault-tolerance and avoid losing critical messages over transient network failures, operations do not rely on fire-and-forget calls.

```
┌─────────────────────────────────────────────────────────────┐
│                       Domain Services                       │
│     (Registration, Teams, Announcements, Judging)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Emits Typed Event
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Transactional Outbox / Event Bus              │
│                 (PostgreSQL Outbox Table)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Asynchronous Dispatcher
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Redis + BullMQ Queue Engine                 │
│      ├── queue: emails (Gmail / SMTP Delivery)              │
│      ├── queue: notifications (In-app & WebSockets)         │
│      └── queue: workflows (Approval / Lifecycle automation) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Worker Consumer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Third-Party Integrations                   │
│         Gmail API / SendGrid · Socket.IO · SMS              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Typed Event Contracts

Defined in `@hackos/shared` and implemented in `apps/api/src/common/events/automation-events.interface.ts`:

### Core Event Names
```typescript
export enum AUTOMATION_EVENTS {
  REGISTRATION_CREATED = 'registration.created',
  REGISTRATION_APPROVED = 'registration.approved',
  REGISTRATION_REJECTED = 'registration.rejected',
  TEAM_CREATED = 'team.created',
  TEAM_MEMBER_JOINED = 'team.member_joined',
  TEAM_COMPLETED = 'team.completed',
  ANNOUNCEMENT_PUBLISHED = 'announcement.published',
  EMAIL_SEND_REQUESTED = 'email.send_requested',
  EMAIL_DELIVERED = 'email.delivered',
  EMAIL_FAILED = 'email.failed',
}
```

### Strongly-Typed Event Payloads

```typescript
export interface RegistrationCreatedPayload {
  registrationId: string;
  eventId: string;
  userId: string;
  email: string;
  fullName: string;
  college: string;
  timestamp: string;
}

export interface RegistrationApprovalPayload {
  registrationId: string;
  eventId: string;
  userId: string;
  email: string;
  fullName: string;
  approvedBy: string;
  approvedAt: string;
  reason?: string;
}

export interface TeamMemberJoinedPayload {
  teamId: string;
  teamName: string;
  eventId: string;
  userId: string;
  userEmail: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
}

export interface EmailSendRequestedPayload {
  idempotencyKey: string;
  recipientEmail: string;
  templateId: string;
  variables: Record<string, any>;
  scheduledFor?: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}
```

---

## 3. Transactional Outbox Pattern & Reliability Guarantees

### A. Idempotency Keys
Every transactional notification or state transition payload is stamped with a deterministic or UUID-based `idempotencyKey`. Workers verify whether a job with the specified key has already executed before triggering third-party delivery APIs.

### B. Reliable Retry Policy
Failed dispatch attempts execute exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 30 seconds
- Attempt 3: After 2 minutes
- Attempt 4: After 10 minutes
- Attempt 5: After 30 minutes

After 5 failed attempts, the job is moved to the **Dead-Letter Queue (DLQ)** and flagged for administrator inspection in the Audit Log.

### C. Rate Limiting & Gmail Quota Management
For Phase 3 (Gmail API integration):
- Outgoing worker queues enforce a leaky bucket rate limit (e.g. maximum 10 emails/second and compliant with daily Google Workspace quota limits).
- High-priority emails (password reset, registration verification) jump to the head of the dispatch queue.

---

## 4. Mail Service Abstraction (`MailService`)

Phase 1 provides a clean operational abstraction (`apps/api/src/mail/mail.service.ts`):
- **Development Mode:** Emits structured debug logs to console and relays to local MailHog (`localhost:1025`) without exposing credentials.
- **Production Mode:** Verifies mandatory SMTP / API credentials on startup. If unconfigured, execution fails safely rather than pretending messages were delivered or leaking raw tokens to users.

---

## 5. Phase 2 & 3 Roadmap Integration

- **Phase 2 (Registration):** Domain services will publish `registration.created` and `registration.approved`.
- **Phase 3 (Email & Queues):** Will wire the Redis BullMQ worker module to consume `EMAIL_SEND_REQUESTED` events and dispatch real HTML templates.
- **Phase 4 (Teams):** Will consume `team.member_joined` to notify leaders and update live team slot counters.
- **Phase 5 (Announcements):** Will consume `announcement.published` to broadcast targeted notifications to confirmed participant cohorts.
