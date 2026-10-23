# NIRAL Hackathon 2026 — Roadmap & Phases

This roadmap tracks the 10-day sprint toward the official launch and automation of NIRAL Hackathon 2026.

---

## 🚀 10-Day Development Roadmap

| Phase | Sprint Dates | Title | Focus Areas | Status |
|---|---|---|---|---|
| **Phase 1** | Oct 23–24 | Foundation, Security & Event Management | Centralized event authority, rebrand, remove fake demo info, admin settings, auth hardening, safe team APIs, outbox/automation architecture. | ✅ **COMPLETED** |
| **Phase 2** | Oct 25–26 | Registration & Approval Workflows | Participant records, approval/rejection lifecycle (Pending/Approved/Waitlisted/Rejected), eligibility rules, participant dashboard. | ⏳ Ready for Implementation |
| **Phase 3** | Oct 27–28 | Transactional Email & Queue Engine | Gmail API / SMTP integration, BullMQ + Redis persistent job queue, automated transactional notifications, delivery tracking. | 📋 Architectural Foundation Ready |
| **Phase 4** | Oct 29–30 | Team Creation & Member Management | Team invitations, join requests, member capacity enforcement, cross-event prevention, team locking. | 📋 Data Sanitization Complete |
| **Phase 5** | Oct 31–Nov 1 | Announcements, Attendance & Operations | Targeted group announcements, QR attendance check-in, judging rubrics, score calculations, certificate issuance. | 📋 Pending Phases 2–4 |

---

## ✅ Phase 1 Verification Checklist (Completed)

- [x] **Authoritative Event Configuration:** Single source of truth in PostgreSQL (`Event` model) with NestJS APIs (`/api/events/current`, `/api/events/admin/:id`).
- [x] **NIRAL 2026 Branding:** Rebranded public landing, navigation, footer, hero, and SEO metadata to NIRAL 2026 (Dates: Dec 3–4, 2026, Asia/Kolkata).
- [x] **Demo Data Cleansing:** Purged synthetic counters, random jitter, unconfirmed prize claims, and fake corporate sponsors. Honest countdown to December 3, 2026.
- [x] **Admin Event Settings:** Full interactive dashboard at `/admin/event-settings` supporting lifecycle state changes, capacity, dates, and audit trail.
- [x] **Authentication Hardening:** Stripped raw token returns in API responses; securely routed emails through `MailService`; removed token leaks in frontend forms.
- [x] **Team API Security:** Sanitized nested Prisma user queries (`passwordHash`, `twoFactorSecret`, OAuth tokens are never returned).
- [x] **Automation & Outbox Architecture:** Typed `AUTOMATION_EVENTS` enum and payload contracts defined in `@hackos/shared` and NestJS.
- [x] **Zero Regressions:** 11/11 backend unit tests passing; all 54 Next.js routes statically built and compiled cleanly without errors.
