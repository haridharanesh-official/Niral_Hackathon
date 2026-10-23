# NIRAL Hackathon 2026 — Centralized Event Configuration

This document specifies the authoritative event configuration system implemented in NIRAL 2026 Phase 1.

---

## 1. Overview & Problem Statement

Prior to Phase 1, event dates, titles, capacities, and prizes were scattered across disconnected mock files, components, and hardcoded routes (e.g. referencing an outdated August 2026 HackOS timeline).

The NIRAL 2026 platform introduces a single authoritative event configuration engine stored in PostgreSQL, maintained via organizer-only admin APIs, and consumed consistently by both backend services and frontend public views.

---

## 2. Confirmed Event Parameters

The following parameters are authoritatively locked for NIRAL 2026:

| Parameter | Authoritative Value | Notes |
|---|---|---|
| **Event Name** | `NIRAL Hackathon 2026` | Official full name |
| **Public Brand** | `NIRAL 2026` | User-facing compact brand mark |
| **Slug** | `niral-2026` | Unique routing identifier |
| **Event Dates** | `December 3–4, 2026` | Physical dates |
| **Timezone** | `Asia/Kolkata` (IST, UTC+5:30) | Standard timezone for all deadlines |
| **Starts At** | `2026-12-03T00:00:00.000Z` | Date-based anchor; exact start time marked unconfirmed |
| **Ends At** | `2026-12-04T23:59:59.000Z` | Date-based anchor; exact end time marked unconfirmed |
| **Has Exact Times** | `false` | Explicit flag preventing fake 9:00 AM claims |
| **Registration Status** | `CLOSED` / `COMING_SOON` | Safeguard pending Phase 2 registration engine |
| **Team Size Limits** | Min: `2`, Max: `4` | Configurable in PostgreSQL |

### Unconfirmed Optional Values (Intentionally Unset)
To prevent misleading participants, the following remain strictly unset (`null`) until officially confirmed by organizers:
- Exact hourly schedules / agendas (indicated as "Schedule TBA").
- Physical venue hall and address (indicated as "Venue to be announced").
- Speculative corporate sponsor logos and testimonials.
- Fabricated prize pool figures (e.g., "$50,000" placeholders have been purged).

---

## 3. Data Model (`Event`)

Extended in `apps/api/prisma/schema.prisma`:

```prisma
enum EventStatus {
  DRAFT
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  UPCOMING
  LIVE
  COMPLETED
  ARCHIVED
}

enum EventMode {
  OFFLINE
  ONLINE
  HYBRID
}

model Event {
  id                   String      @id @default(uuid())
  slug                 String      @unique
  name                 String
  publicDescription    String?
  tagline              String?
  organizerName        String?
  officialEmail        String?
  contactPhone         String?
  websiteUrl           String?
  timezone             String      @default("Asia/Kolkata")
  startsAt             DateTime
  endsAt               DateTime
  hasExactTimes        Boolean     @default(false)
  venueName            String?
  venueAddress         String?
  eventMode            EventMode   @default(OFFLINE)
  registrationStartsAt DateTime?
  registrationEndsAt   DateTime?
  registrationEnabled  Boolean     @default(false)
  maxCapacity          Int?
  minTeamSize          Int         @default(2)
  maxTeamSize          Int         @default(4)
  prizePool            String?
  status               EventStatus @default(DRAFT)
  isPublished          Boolean     @default(true)
  isActive             Boolean     @default(true)
  logoUrl              String?
  bannerUrl            String?
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
}
```

---

## 4. API Endpoints

### Public Endpoints

#### `GET /api/events/current`
Returns the active published event configuration. Safe for anonymous users and CDN caching.
- **Access:** Public
- **Response Shape:**
```json
{
  "id": "e8a931c8-2b87-4b71-b0db-6878b277d3f1",
  "name": "NIRAL Hackathon 2026",
  "slug": "niral-2026",
  "tagline": "Innovate. Build. Secure.",
  "timezone": "Asia/Kolkata",
  "startsAt": "2026-12-03T00:00:00.000Z",
  "endsAt": "2026-12-04T23:59:59.000Z",
  "hasExactTimes": false,
  "status": "UPCOMING",
  "registrationEnabled": false,
  "minTeamSize": 2,
  "maxTeamSize": 4
}
```

#### `GET /api/events/:slug`
Fetches a specific event by its unique slug identifier.

---

### Protected Administrative Endpoints

#### `GET /api/events/admin/:id`
Retrieves the complete internal event record for administrative review.
- **Access:** Requires JWT Bearer Token + `ORGANIZER` or `ADMIN` role.

#### `PATCH /api/events/admin/:id`
Updates event settings, schedule dates, registration toggles, and lifecycle status.
- **Access:** Requires JWT Bearer Token + `ORGANIZER` or `ADMIN` role.
- **Validation Rules (`UpdateEventDto`):**
  - If both `startsAt` and `endsAt` are provided, `endsAt` must be strictly after `startsAt`.
  - If both `registrationStartsAt` and `registrationEndsAt` are provided, `registrationEndsAt` must be after `registrationStartsAt`.
  - `minTeamSize` must be `>= 1` and `<= maxTeamSize`.
- **Audit Logging:** Every patch triggers an immutable entry in the `AuditLog` table containing the actor ID, action `EVENT_SETTINGS_UPDATED`, resource ID, and non-sensitive modified fields.

---

## 5. Administrative Interface (`/admin/event-settings`)

Located at `apps/web/src/app/admin/event-settings/page.tsx`, the management interface provides:
1. **General Information:** Event name, public tagline, official organizer email, contact phone, website URL.
2. **Dates & Schedule:** Start date, end date, exact time confirmation toggle, timezone selector.
3. **Registration & Teams:** Registration enable/disable switch, participant capacity cap, min/max team size controls.
4. **Lifecycle & Publication:** Dynamic status switch (`DRAFT`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `UPCOMING`, `LIVE`, `COMPLETED`, `ARCHIVED`).
5. **Realtime Feedback:** Instant validation, pending saving indicators, and success confirmation toasts matching the cyber dark theme.
