# NIRAL Hackathon 2026 — Complete Public Website Implementation
## Codex master task — Image-guided implementation, 10 public routes, existing theme LOCKED

### Mission
Implement the public-facing NIRAL hackathon website in the existing repository, using the **ten page image references** in `references/` as design briefs for their corresponding routes. **Write actual Next.js/React code in the existing project**; these PNGs are reference mockups, not code and not content that can be pasted into production unchanged.

Official website: https://niralhackathon.dpdns.org/
Existing repository: https://github.com/haridharanesh-official/Niral_Hackathon
Event: **NIRAL Hackathon 2026** — **December 3–4, 2026**, Asia/Kolkata.
Official contact: **iotclub.siet@gmail.com** and **+91 8508511975**.
Confirmed venue: **Sri Shakthi Institute of Engineering and Technology**.

### Priority 0 — Inspect, preserve, and establish baseline
1. Check Git status and branch; do not discard uncommitted work. Inspect the running/live homepage and repository frontend, routing, layouts, CSS variables, fonts, component styles, and backend data services before editing.
2. The **live deployed homepage** is the authoritative source for the global theme and should remain visually unchanged. The `references/01_home_introduction.png` image is a conceptual reference, **not authorization to replace or redesign `/`**. Only repair a truly broken link or behavior after verifying the difference; report any unavoidable visual change before applying it.
3. Use current web stack (Next.js App Router, React, TypeScript, Tailwind, existing motion libraries), existing header/footer, NextAuth/session handling, NestJS/Prisma data services. Do not migrate frameworks or add a second auth/registration backend.
4. **Visual theme locked:** white/off-white subtle dotted grid background, black editorial Space Grotesk typography and readable body font, coral `#FD9B9B` family, pale peach heading highlights, black outlined tactile cards, offset 3D-press shadows, Vengeance UI Pop Button styling, and the existing desktop/mobile nav.
5. Inventory existing routes and components; extend the existing implementations rather than create redundant versions.

### Image-to-route mapping — inspect each file visually before coding
- `references/01_home_introduction.png` → `/` — illustrative concept only; preserve deployed homepage.
- `references/02_about_niral.png` → `/about` — concept board hero, mission, pillars, experience, CTA.
- `references/03_how_to_participate.png` → `/participate` — journey, eligibility, account/apply flow, FAQs.
- `references/04_innovation_tracks.png` → `/tracks` — track constellation, search, filters, real tracks and details.
- `references/05_problem_statements.png` → `/problems` — challenge board, searchable/filtered official problem catalog.
- `references/06_event_schedule.png` → `/schedule` — two-day tabs and timeline from confirmed schedule items.
- `references/07_rules_eligibility.png` → `/rules` — official rules accordions, eligibility and code of conduct.
- `references/08_official_updates.png` → `/updates` — official pinned/latest announcements and categories.
- `references/09_frequently_asked_questions.png` → `/faq` — searchable, categorized accessible FAQs.
- `references/10_contact_venue.png` → `/contact` — confirmed contact details, venue, verified map/directions.

### Important warning: Mockup content is NOT confirmed event data
The images are **art-direction drafts**. They include some example-only data and copy: invented problem statements, problem counts, exact day schedules, registration-open announcements, team limits, eligibility classes, competition fees, prizes, mentor access, attendee quantities, specific sessions, and social channels. **Do not publish these as facts.** Bind real published event/config/CMS data from the existing backend. When missing, use a tasteful TBA/unpublished empty state in the same design language. Exact scheduled hours and calendar links require confirmed times. Do not fake records, render invented testimonials, or announce unsent emails.

### Shared UI architecture
- Reuse the global Header, Footer, Pop Button, tactile shadow/button primitives, dot canvas, hero highlight text, graphic language, responsive containers, focus rings, loading/error/empty states.
- Use actual Vengeance UI components where they genuinely improve fit: https://www.vengenceui.com/ and its Pop Button. Check installed versions and docs before adding dependencies. Do not bring default demo styling that alters the existing site.
- Each new route receives a distinct hero art direction matching its image; reuse components without making every page visually identical. Build **real interactive-looking depth** via accessible layered DOM, SVG, CSS perspective and restrained Framer Motion. Do not paste the PNG screenshot as an image overlay pretending to be a page.
- All actionable cards/buttons/tabs/search/filter/accordion controls must work. Avoid nested clickable elements. Support keyboard, screen reader semantics, touch and reduced motion. Only lazy-load heavier 3D effects, with static mobile/reduced-motion fallback.
- Keep page-level metadata, headings and breadcrumbs semantically correct. Correct outdated August 2026 metadata if verified, without altering homepage visuals.

### Implement each page with this minimum specification

**02 /about**: Intro hero 'More than a hackathon' with lively layered interactive conceptual 3D art, mission/vision intro, three tactile pillars (Imagine / Collaborate / Create), visually varied NIRAL experience section, closing registration/participation CTA. Avoid suggesting unconfirmed workshops/mentors are guaranteed. Routes to `/participate` and `/tracks`.

**03 /participate**: Clear four-step journey Explore → Create account → Apply → Track status. Interactive selection/progress explanation cards; safe verified eligibility and published registration settings; real links to `/register`, `/login`, authenticated `/apply`, `/dashboard`. Never fabricate registration fees/team size. Registration CTA must reflect actual availability; use existing auth flow.

**04 /tracks**: Illustrated 3D domain constellation, working search and category chip filters, responsive card grid of **published** tracks, detail route if supported `/tracks/[slug]`, related problems, informative empty state. No made-up '12 problems' badges or unofficial track roster.

**05 /problems**: Creative stacked challenge card hero, working text search, track/category/difficulty filters against **publicly published** problem statements only, optional `/problems/[slug]` with objectives/deliverables/constraints from data source. Empty state, pagination or progressive display, keyboard controls. Do not use the fake six mock problems as official.

**06 /schedule**: Dynamic Day 1 (Dec 3) / Day 2 (Dec 4) tabs, published session timeline with accurate time zone/location, notes, updates; day-specific empty state until organizers publish exact times. Calendar actions only for actual scheduled timestamps. The mockup's exact hours/venue subrooms are NOT authorized facts.

**07 /rules**: Searchable or grouped accessible rule accordions, published rules/eligibility/team policy/code of conduct, important notices, link to official downloadable rules only when a file really exists. No speculative 2–4 team policy, eligibility, legal terms, AI usage restrictions or disqualification decisions.

**08 /updates**: Public announcement list, pinned notices, category filters, publication timestamps, read-only detail route optionally `/updates/[slug]`; real backend publication state, no mock October dates, fake 'registration now open' claims or pretend mailing list. If email subscription is not integrated, show contact and account notification preferences instead.

**09 /faq**: Search that filters questions/answers, keyboard-accessible accordion and category tabs, only approved FAQ entries, graceful empty state, contact CTA with verified information. Avoid asserting event is free or allowing arbitrary team size unless confirmed.

**10 /contact**: Exact email `iotclub.siet@gmail.com`, exact phone `+91 8508511975`, confirmed venue institute name, mailto and tel actions. Verify the actual map/address before embedding or asserting coordinates/postal address; navigation opens a trusted map destination. Contact form only if it connects to an actual secure backend workflow, otherwise show real email/phone interactions.

### Work sequence and verifications
1. Analyze the ten images and source; report a short implementation checklist internally, then proceed without stopping at planning.
2. Build `/about`, `/participate`, `/tracks`, `/problems`, `/schedule`, `/rules`, `/updates`, `/faq`, `/contact` in that order. Design variants follow the images; do not modify shared design tokens unless absolutely necessary and homepage regression is validated.
3. Ensure every selected public route is reachable from the existing header/footer and that cards/CTAs navigate intentionally; no 404 links.
4. Data handling: server-only secrets, correct RBAC, no exposing draft content/private attendee data. Preserve Phase 1/2 work and existing application auth/session API integration.
5. Responsive checks: 1440, 1024, 768, 390 and 360 px. No body-level horizontal overflow, meaningful mobile behavior and no contrast failures.
6. Run actual existing repo commands for lint, TypeScript, tests, build; check routes and interactions locally. Do browser screenshots and compare new pages with corresponding PNGs where available; compare `/` before and after to ensure homepage visuals unchanged.
7. Produce a report: files modified, components reused/new, per-route functionality status, data bindings, placeholders held unpublished, visual comparison evidence, tests, blockers, Git status/diff.

### Safety: no publication without approval
**Do not commit, push, merge, deploy, reset databases, modify production infrastructure, leak credentials, or send public communications.** Work locally; request approval before any Git write to remote or production action. If runtime dependencies cannot be started, complete safe local code and report test limits precisely.

### Done criteria
All ten selected public routes render, with existing `/` intact and the remaining nine matching their respective concept images and the approved live theme; public interaction works; dynamic facts are only sourced from confirmed/published data; user data is protected; navigation works on desktop/mobile; available build/tests pass. No unapproved public changes.

**EXECUTE THE IMPLEMENTATION NOW. Read the image references first. Do not respond with another plan instead of code.**
