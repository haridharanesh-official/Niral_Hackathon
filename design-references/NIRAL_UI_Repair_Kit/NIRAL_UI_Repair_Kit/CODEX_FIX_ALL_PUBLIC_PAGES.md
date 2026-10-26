# NIRAL Hackathon 2026 — Comprehensive Public UI Repair (Codex)

## Scope and restrictions

Repository: `https://github.com/haridharanesh-official/Niral_Hackathon`
Reference: `https://niralhackathon.dpdns.org/`
Current visual direction is **approved and locked**: white dotted canvas, coral `#FD9B9B`, soft highlight `#FFE2DB`, near-black outlines, tactile shadows and buttons, bold Space Grotesk/Inter typography. Keep the homepage's appearance and functionality as a regression baseline. No redesign, rebranding, dark theme, new palette or unrelated backend changes.

**Work locally. Do not commit, push, merge, or deploy without explicit approval.** Preserve unrelated changes. Do not delete live data or run production migrations.

## User-reported blocker with screenshots

The screenshots in `screenshots/` show:
- `01_about_current_obscured.png`: an oversized foreground browser window occludes the About artwork's floating labels; it looks flat and incomplete.
- `02_home_art_approved_reference.png`: the desired layered, smaller tilted center window with *four visible floating labels* and clear tactile depth.

Inspect actual current source before editing. These were inspected on GitHub main at the time this brief was prepared:

- `apps/web/src/components/niral/art-components.tsx`: AboutHeroArt and nine other art components.
- `apps/web/src/components/niral/public-pages.module.css`: `.artCanvas`, `.interactiveStack`, `.floatingBadge`, responsive rules.
- `apps/web/src/components/niral/hero-art.tsx`: homepage illustration.
- `apps/web/src/components/niral/niral.module.css`: shared homepage UI.
- `apps/web/src/components/niral/public-page-shell.tsx`: shared navigation and footer.
- Page files: `about-page.tsx`, `participate-page.tsx`, `tracks-page.tsx`, `problems-page.tsx`, `schedule-page.tsx`, `rules-page.tsx`, `updates-page.tsx`, `faq-page.tsx`, `contact-page.tsx`.

## 1. Fix AboutHeroArt specifically

The existing AboutHeroArt uses a *large foreground window* (`inset: '4% 6% 12% 6%'`, `translateZ(20px)`, `overflow:'hidden'`) and four floating badges within the same `motion.div.interactiveStack` with no explicit foreground depth. The result can paint the main window over the floating badges; labels are partially obscured and the art looks flat. This is a code-grounded finding, not just a visual opinion.

Required repairs:
1. Create visual depth with independently layered **rear/back cards**, smaller and slightly tilted foreground browser window, coral raised code tile and tactile black shadow.
2. Move functional badges into a separate foreground overlay *outside* the tilted 3D window's stacking context, or make foreground stacking deterministic without z-fighting.
3. Preserve four visible badges: Ideas, Build, Innovate and Collaborate. Never hide a badge beneath the code window, CTA, or another sibling.
4. Give badges meaningful toggled states and screen-reader accessible descriptions. Keep pointer, keyboard and touch support.
5. Use a stable layout with responsive art dimensions; no negative left/right offsets that cause clipping below 390px.
6. Honor reduced-motion preferences. Avoid permanent uncontrolled animations.
7. Preserve the existing theme exactly.

There is a **candidate local-only patch script** named `fix_about_art.py` in this repair kit. It updates only `art-components.tsx` and `public-pages.module.css` to replace the specific About art and improve global badge foreground depth. It supports `--check` and safe `--apply` with backups. Inspect it and compare against the *actual working branch* before using; if the code has diverged, implement the intent manually rather than blindly applying a patch.

## 2. Audit every public artwork component

In `art-components.tsx`, inspect and correct all these visual compositions:

- `AboutHeroArt`
- `AboutExperienceArt`
- `ParticipateHeroArt`
- `TracksConstellationArt`
- `ProblemsChallengeArt`
- `ScheduleCalendarArt`
- `RulesGuidelinesArt`
- `UpdatesNoticeBoardArt`
- `FaqQuestionsArt`
- `ContactMapArt`

Also verify the homepage `HeroArt` in `hero-art.tsx` against its existing approved rendering; do not alter its visual composition unless fixing a genuine, demonstrated defect.

For each art component, verify: visible panels in correct order; sensible centering; no occluded text or badges; no invisible buttons; no clipped content; no page-wide overflow; adequate room inside hero grids; correct pointer tilt; readable labels; reduced-motion support; stable at common browsers and at 1440, 1280, 1024, 768, 430, 390, 360px.

Avoid naive `z-index: 9999` on everything; use a comprehensible layer contract (stage/back layer, front window, decorative foreground, interactive foreground). Ensure CSS 3D transforms do not inadvertently defeat layer order. Avoid pseudo-3D panels that cover the entire art viewport at smaller breakpoints.

## 3. Review all 10 public pages (actual routes)

| Route | Visual and functional review |
| --- | --- |
| `/` | Approved home design remains unchanged; verify hero labels, cards, CTA links, event info, 3D tilt, mobile menu. |
| `/about` | Fix obscured illustration; check three pillars, experience art, CTA spacing, readability. |
| `/participate` | Onboarding illustration; responsive journey cards; account form focus and correct flow; accurate eligibility/fee disclosures. |
| `/tracks` | Track constellation; chips, filter/search; card icon alignment; modal and overlay focus management. |
| `/problems` | Challenge artwork; search/filters; empty-state design; no demo problems presented as officially published. |
| `/schedule` | Calendar art and day tabs; narrow timeline; unknown exact session times should not be shown as confirmed. |
| `/rules` | Rules art; accordion; readability and mobile stacking; don't assert unconfirmed team limits or AI policies. |
| `/updates` | Bulletin art; notice cards and feeds; announcements must be genuine published records; no fabricated dates. |
| `/faq` | Support art; search/category tabs; accordion, accessibility, consistent answers to rules. |
| `/contact` | Map/contact art; cards, copy buttons, directions, map zoom; distinguish illustrative map from actual map. |

## 4. Shared UI system and responsiveness

1. Audit `niral.module.css`, `public-pages.module.css` for rigid widths, low-contrast text, horizontal clipping via `overflow: clip`, overflowing cards, negative offsets and breakpoints.
2. Use shared scene classes instead of scattering conflicting absolute transforms through every page.
3. Keep global color palette, logo, typography, background and PopButton unchanged.
4. Make header and footer consistent across all public pages; support `Updates` navigation without overflow.
5. Remove misleading generic placeholder social links in `public-page-shell.tsx` (`https://youtube.com`, `https://instagram.com`, `https://linkedin.com`) until configured official links exist. Preserve verified NIRAL-linked profiles only.
6. Use real status updates or disabled states for unfinished interactions; no decorative links that lead to nowhere.
7. Respect prefers-reduced-motion including **the infinite spinning icon** in `AboutExperienceArt` and the bouncing map pin in `ContactMapArt`.
8. For page-specific modals, add Escape handling, focus trapping/return, aria semantics, keyboard controls, scroll locking, and close-button focus.

## 5. Repair content/UI contradictions discovered from source

The current `participate-page.tsx` says the event is 'completely free', but `faq-page.tsx` says fee details will be confirmed; `rules-page.tsx` asserts teams of 2–4 but FAQ says team size is unconfirmed. Resolve by reading confirmed event configuration or showing unpublished/TBA text consistently. Do not invent facts.

Likewise, `schedule-page.tsx` currently contains detailed hardcoded timings and events: treat them as a draft until organizer approval is confirmed, and only show published schedule entries. `updates-page.tsx` currently uses a static in-component announcement array: check content provenance and do not present static demo notices as official. `about-page.tsx` references mentorship guidance as a confirmed benefit; verify or rephrase as aspirational without inventing speaker/mentor commitments.

These are not an invitation to change the website's theme; treat them as trust-and-accuracy UX fixes.

## 6. Implementation approach

- Audit before editing and capture baseline screenshots.
- Fix About hero and the shared art components first.
- Fix cross-page responsive issues next.
- Correct interactions/accessibility and published content states.
- Verify one page at a time, comparing against its approved design mockup (if present in `design-references/NIRAL_Public_Website_Design_Kit/`).
- Preserve backend and database APIs.
- Keep changes tightly scoped; do not replace entire page files when targeted changes suffice.

## 7. QA and acceptance gates

Use the included `public-ui-qa.spec.ts` as a starting Playwright smoke/regression suite, adapting it to the project's existing setup. Test across 1440, 1024, 768, 390 and 360 widths.

Before declaring PASS, supply:
- Before/after About artwork screenshots at desktop and mobile.
- Screenshots of every remaining public page at desktop and mobile.
- Proof all floating artwork badges are visible and clickable (not hidden under another element).
- No horizontal overflow, text clipping, or overlapping CTA buttons.
- No broken navigation, dead links, or nonfunctional form controls.
- No keyboard accessibility regressions.
- Homepage screenshot comparison: approved homepage theme and structure unchanged.
- Build, lint, typecheck and route smoke-test results.
- List of confirmed issues fixed versus outstanding and blocked checks.
- Git diff and `git status --short`.

**Do not claim complete visual QA if browser access was unavailable.**

Final report: exact changed files, short root-cause explanation for each fixed defect, screenshot evidence, tests, residual risks, and explicit confirmation that nothing was committed/pushed/deployed.
