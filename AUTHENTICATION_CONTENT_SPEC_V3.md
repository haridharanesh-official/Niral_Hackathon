# NIRAL 2026 — Authentication & Registration Design Specification · V3

**Status:** Design-only, pending Figma editor import/review. No user records or backend calls.

## Locked decisions

- **registrationAudience:** Students / approved eligible participants only
- **teamFormation:** Only after account registration and email verification; team creation/join is in the team dashboard
- **payments:** Conditional feature; hidden from registration unless fees are confirmed and configured by authorized organizers
- **masterPublishing:** Authorized Master user can directly publish content changes after explicit confirmation; server authorization and audit required in implementation
- **dashboard3D:** 3D-interactive widgets across authenticated role dashboards; reduce motion and keyboard controls supported
- **theme:** Preserve current NIRAL public-site design; no changes to original public artboards
- **backend:** No backend or frontend repository implementation in this phase

## Approved user journey

Sign Up — Welcome → Register — Personal → Register — Academic → Register — Skills → Register — Secure Account → Registration Review & Consent → Verify Email → Account Verified → Profile Completion → Participant Dashboard → Create or Join Team.

The sign-in, recovery, invitation and session-expiry flows are independent branches of the same authentication design system.

## Screen specifications

### AUTH-00 — Sign Up — Welcome

**Headline:** Build what matters.
**Supporting text:** Your journey to NIRAL Hackathon 2026 starts here.
**Body:** Create your student account first. You can create or join a team after verifying your email.

**Content blocks:** A valid email address; Your academic information; A few skills and interests; A secure password

**Primary CTA:** Start student registration
**Secondary CTA:** Already registered? Sign in
**Previous / Next:** None → Register — Personal
**Design states:** eligibility information, focus and hover, resume registration
**Special note:** Participation is limited to students who meet published eligibility rules. No payment is collected during account creation.

### AUTH-01 — Register — Personal

**Headline:** First, tell us about you.
**Supporting text:** Use your name and email so we can create your participant account.
**Body:** Required details are marked with *. Enter a personal or college email that you can access.

**Exact fields:**

- **First name** — text; required. Placeholder: e.g. Arjun. Helper: As used for your event registration.
- **Last name** — text; required. Placeholder: e.g. Kumar. 
- **Display name** — text; optional. Placeholder: How teammates will see you. 
- **Email address** — email; required. Placeholder: you@example.com. Helper: Only one email field. Verification link goes here..
- **Mobile number** — tel; required. Placeholder: +91 98765 43210. Helper: Include country code where applicable.

**Content blocks:** One email address; Unique account per participant; Edit before submission

**Primary CTA:** Continue to academics
**Secondary CTA:** Back
**Previous / Next:** Sign Up — Welcome → Register — Academic
**Design states:** empty, required field error, email format error, duplicate email, valid
**Special note:** Email is not publicly displayed. Never show passwords or verification tokens in draft previews.

### AUTH-02 — Register — Academic

**Headline:** Where do you study?
**Supporting text:** Tell us about your current student enrollment.
**Body:** Student eligibility will be reviewed according to the official NIRAL rules.

**Exact fields:**

- **College / institution** — text; required. Placeholder: Full official institution name. 
- **Department** — text; required. Placeholder: e.g. Electronics and Communication. 
- **Degree / program** — select; required. Placeholder: Select your degree.  Options: B.E. / B.Tech, B.Sc., BCA, M.E. / M.Tech, M.Sc., MCA, Other eligible program.
- **Year of study** — select; required. Placeholder: Select academic year.  Options: First year, Second year, Third year, Fourth year, Fifth year / Other.
- **Student / roll ID** — text; optional. Placeholder: Optional if available. 

**Content blocks:** Students only; Institution required; Eligibility subject to published rules

**Primary CTA:** Continue to skills
**Secondary CTA:** Back
**Previous / Next:** Register — Personal → Register — Skills
**Design states:** institution autocomplete concept, degree selection, ineligible information, required field error
**Special note:** Do not include professional employment fields or a separate professional registration pathway.

### AUTH-03 — Register — Skills

**Headline:** What do you love building?
**Supporting text:** Choose what excites you. You can update your interests later.
**Body:** Skills help you explore relevant tracks; they are not used to reject eligible participants.

**Exact fields:**

- **Experience level** — select; optional. Placeholder: Choose a level (optional).  Options: Beginner, Intermediate, Advanced, Expert.
- **Preferred innovation track** — select; optional. Placeholder: Choose a track (optional).  Options: AI + IoT, Smart Agriculture, Industrial Automation, Healthcare IoT, Smart Cities, Robotics & Embedded.
- **GitHub profile** — url; optional. Placeholder: https://github.com/username. 

**Skill chips:** Arduino, ESP32, Raspberry Pi, Python, Embedded C, C++, React, Computer Vision, AI / ML, Robotics, MQTT, Cybersecurity

**Content blocks:** Tap skills to select; No minimum skill level; You can change your track later

**Primary CTA:** Continue to security
**Secondary CTA:** Back
**Previous / Next:** Register — Academic → Register — Secure Account
**Design states:** no chips selected, selected tags, chip removal, search interest
**Special note:** Optional skills and portfolio links must not prevent account creation.

### AUTH-04 — Register — Secure Account

**Headline:** Create your secure account.
**Supporting text:** Choose a strong password you have not used elsewhere.
**Body:** Passwords are never saved in the design prototype or displayed on the review page.

**Exact fields:**

- **Password** — password; required. Placeholder: Create a strong password. Helper: At least 12 characters recommended; use a unique passphrase.
- **Confirm password** — password; required. Placeholder: Repeat your password. 

**Content blocks:** Show / hide password; Strength indication; Confirm passwords match

**Primary CTA:** Review registration
**Secondary CTA:** Back
**Previous / Next:** Register — Skills → Registration Review & Consent
**Design states:** weak password, mismatch, visibility toggle, strong passphrase
**Special note:** Never place the password in the Figma review summary or browser storage. Real policy and breach checks will be finalized for implementation.

### AUTH-05 — Registration Review & Consent

**Headline:** Everything look right?
**Supporting text:** Review your details before creating your NIRAL account.
**Body:** Review identity, institution, contact, and skills. Your password is never shown.

**Exact fields:**

- **I have read and agree to the NIRAL participation rules** — checkbox; required. 
- **I understand the privacy notice and processing needed for registration** — checkbox; required. 
- **I agree to follow the event code of conduct** — checkbox; required. 
- **Send optional event newsletters (optional)** — checkbox; optional. 

**Content blocks:** Personal details; Academic information; Skills and interests; Security (password hidden)

**Primary CTA:** Create my NIRAL account
**Secondary CTA:** Edit details
**Previous / Next:** Register — Secure Account → Verify Email
**Design states:** review summary, consent missing, submitting, network error, submitted
**Special note:** Mandatory consents must not be preselected. Account creation is simulated only; do not imply successful server registration.

### AUTH-06 — Verify Email

**Headline:** Check your inbox.
**Supporting text:** We’ll send a verification link to your registered email.
**Body:** Open the email and follow the secure verification link. If you cannot find it, check spam.

**Content blocks:** Email sent to your registration address; Resend verification email; Change email address; Return to sign in

**Primary CTA:** Simulate email verified
**Secondary CTA:** Resend link (demo)
**Previous / Next:** Registration Review & Consent → Account Verified
**Design states:** link sent, resend cooldown, expired link, verified, resend rate limit
**Special note:** In the live product, success is confirmed only after the backend validates a valid one-time link. Never display raw verification tokens.

### AUTH-07 — Account Verified

**Headline:** You’re officially in.
**Supporting text:** Your email is confirmed. You can now sign in and set up your participant profile.
**Body:** Next: open your participant workspace and create or join a team.

**Content blocks:** Account email confirmed; Profile setup available; Create or join a team after sign-in

**Primary CTA:** Continue to profile setup
**Secondary CTA:** Go to sign in
**Previous / Next:** Verify Email → Profile Completion
**Design states:** verification confirmed, celebration with reduced-motion support
**Special note:** Email verification is not the same as event eligibility approval.

### AUTH-08 — Profile Completion

**Headline:** Make this profile yours.
**Supporting text:** Add the details teammates will see in your workspace.
**Body:** Optional profile enhancements. None of these fields ask you to create a team here.

**Exact fields:**

- **Profile display name** — text; optional. Placeholder: How you want to be known. 
- **GitHub profile** — url; optional. Placeholder: https://github.com/username. 
- **LinkedIn profile** — url; optional. Placeholder: https://linkedin.com/in/username. 
- **Short bio** — textarea; optional. Placeholder: What would you like to build?. 

**Content blocks:** Avatar upload concept; Skills from registration; Profile completion meter

**Primary CTA:** Open participant dashboard (demo)
**Secondary CTA:** Skip for now
**Previous / Next:** Account Verified → Participant Dashboard (handoff)
**Design states:** blank profile, avatar upload preview, save success, skip
**Special note:** Team creation/join options appear in the participant/team workspace after sign-in.

### AUTH-09 — Sign In

**Headline:** Welcome back, builder.
**Supporting text:** Sign in to your NIRAL participant workspace.
**Body:** Use the email you registered with. Your session opens only after successful authentication.

**Exact fields:**

- **Email address** — email; required. Placeholder: you@example.com. 
- **Password** — password; required. Placeholder: Enter your password. 

**Content blocks:** Forgot password?; Create a new account; Secure session; Google Sign-In if configured

**Primary CTA:** Sign in (demo)
**Secondary CTA:** Create participant account
**Previous / Next:** None → Participant Dashboard (handoff)
**Design states:** invalid credentials, unverified email, temporarily rate limited, 2FA if enabled, success
**Special note:** Google Sign-In is an optional entry point only once provider setup and account linking are verified; do not portray it as already available.

### AUTH-10 — Forgot Password

**Headline:** Forgot your password?
**Supporting text:** We’ll help you get back to building.
**Body:** Enter your registration email. If an account exists, recovery instructions will be sent.

**Exact fields:**

- **Registered email address** — email; required. Placeholder: you@example.com. 

**Content blocks:** Check your inbox; Resend guidance; Secure, time-limited link

**Primary CTA:** Send recovery instructions
**Secondary CTA:** Back to sign in
**Previous / Next:** Sign In → Recovery Result
**Design states:** invalid email, request received, rate limit, generic account-existence-safe message
**Special note:** The confirmation text must be neutral: do not reveal whether an account exists for the supplied address.

### AUTH-11 — Reset Password

**Headline:** Choose a new password.
**Supporting text:** Use a new, unique passphrase to protect your account.
**Body:** A valid password-reset link is required in the real application.

**Exact fields:**

- **New password** — password; required. Placeholder: New strong password. 
- **Confirm new password** — password; required. Placeholder: Repeat your new password. 

**Content blocks:** Strength meter; Show or hide password; Invalid / expired link state

**Primary CTA:** Update password (demo)
**Secondary CTA:** Back to sign in
**Previous / Next:** Forgot Password → Recovery Result
**Design states:** valid reset link, expired link, invalid token, password mismatch, reset success
**Special note:** Never present password-reset success without a valid server-side reset token in the real implementation.

### AUTH-12 — Recovery Result

**Headline:** Check your next step.
**Supporting text:** If that email matches an account, recovery instructions are on their way.
**Body:** This page uses neutral language to protect account privacy.

**Content blocks:** Check inbox and spam; Try again after cooldown; Return to login

**Primary CTA:** Go to sign in
**Secondary CTA:** Try another email
**Previous / Next:** Forgot Password → Sign In
**Design states:** instructions requested, password changed, link expired, generic failure
**Special note:** Separate variants are required for reset completed, link expired, and recovery mail requested.

### AUTH-13 — Invite Acceptance

**Headline:** A team wants you onboard.
**Supporting text:** Review your invitation after signing in to your verified NIRAL account.
**Body:** Joining a team never happens during initial account registration.

**Content blocks:** Team name and track; Invited by verified team leader; Current member count; Invitation expiry

**Primary CTA:** Accept invitation (demo)
**Secondary CTA:** Decline / Back
**Previous / Next:** Sign In → Participant Dashboard (handoff)
**Design states:** valid invitation, login required, expired invitation, team full, already in a team, accept success
**Special note:** Real team invite acceptance requires a valid invitation, confirmed identity, event membership and capacity checks.

### AUTH-14 — Session Expired

**Headline:** Your session has ended.
**Supporting text:** For your security, sign in again to continue.
**Body:** The app may preserve non-sensitive form drafts, but never session tokens or passwords in design storage.

**Content blocks:** Sign in securely; Recover your account; Session expired for security

**Primary CTA:** Sign in again
**Secondary CTA:** Return to public site
**Previous / Next:** None → Sign In
**Design states:** idle timeout, signed out, revoked session, safe redirection
**Special note:** Do not expose a previously signed-in participant’s private data on this screen.

## Reusable component inventory

- `Auth/BrandMark`, `Auth/TwoColumnShell`, `Auth/DotCanvas`, `Auth/OrbitalScene` (drag/rotate/zoom/reset)
- `Input/Text`, `Input/Email`, `Input/Tel`, `Input/Select`, `Input/Password`, `Input/ValidationMessage`, `Input/Checkbox`
- `Wizard/5StepProgress`, `Wizard/BackButton`, `Wizard/ContinueButton`, `Wizard/ReviewCard`
- `Choice/SkillChip`, `Choice/TrackChip`, `Disclosure/PasswordStrength`, `Disclosure/SecurityInfo`
- `State/Success`, `State/Error`, `State/SessionExpired`, `State/EmailSent`, `State/LinkExpired`
- `Button/PopPrimary`, `Button/PopSecondary`, `Button/Disabled`, `Button/Loading`

## Validation and interaction contract

1. Personal: first/last name (minimum 2 characters), valid email, and plausible telephone number; do not demand a separate college email.
2. Academic: institution, department, degree/program, year; student ID optional. Eligibility decisions follow verified event rules and cannot be inferred by form styling.
3. Skills: optional chips, track, experience and GitHub profile; empty selections must not block completion.
4. Security: unique passphrase with 12+ characters as a design recommendation, confirm match, reveal toggle, strength guidance. Match actual backend policy during later implementation.
5. Review: show all collected non-secret data; mandatory consent checkboxes start unchecked; optional marketing consent separately unchecked.
6. Verification: use a one-time email verification link (not a plaintext token in the UI), resend cooldown, expired-link and recovery states.
7. Only after verified sign-in offer create/join team. An invitation may be opened during an unauthenticated session but must require sign-in before acceptance.
8. Login/recovery responses must not disclose whether an account exists.
9. On screens with 3D interaction, support pointer drag, arrow keys, reset, zoom and `prefers-reduced-motion`; artwork must never trap keyboard or obstruct a form.
10. No mock success claim implies backend completion. All prototype actions are local and clearly labeled.

## Figma source components and design tokens

Use the existing NIRAL public theme unchanged: `#FFFFFF` dotted canvas, `#FAF7F2` paper, `#111111` ink, `#FD9B9B` coral, `#FFE2DB` blush, 2px outlines and 4px offset hard shadows. Use Space Grotesk-style headings. Mobile designs should stack visual art below (or beside) form content without compromising validation text.

## Figma plan

Auth page must have 15 editable desktop frames, corresponding mobile constraints, proper button states and variants, and a single editable component library. The local builder generates these frames; validate in the real editor before approving.

## Release gate

Do not implement frontend or backend until the Figma page-by-page review is approved. The next design section is Participant Dashboard.
