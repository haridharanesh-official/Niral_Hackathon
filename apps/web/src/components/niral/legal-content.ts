export type LegalSection = { id: string; title: string; paragraphs: string[] };
export const legalVersion = '0.1 · Review draft';
export const legalUpdated = '8 November 2026';

export const privacySections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction and organizer',
    paragraphs: [
      'NIRAL Hackathon 2026 is an innovation event with participant accounts, registration, teams, project submissions and event administration. This notice describes the current website implementation and separately identifies integrations that are not enabled.',
      'The website identifies the organizing team as IoT Club, Sri Shakthi Institute of Engineering and Technology. The legally responsible operator and designated privacy/grievance contact still require organizer confirmation. The published general event contact is iotclub.siet@gmail.com; it is not yet a confirmed statutory grievance address.',
    ],
  },
  {
    id: 'information',
    title: 'Information collected',
    paragraphs: [
      'Student registration collects first and last name, display name, email, contact number, institution, department, degree, year of study and skills. Student ID, experience, preferred track and a GitHub profile are optional. Account records include a password hash, verification status, role, session records and registration declarations with their versions and timestamps.',
      'Where supplied through profile and collaboration features, records can include a profile image, biography, location, professional or academic details, profile links, notification preferences, team membership, invitations, project tasks and documents, submission files and versions, judging scores and notes, and participation activity. Do not include another person’s confidential information in submissions.',
      'Payment features record order and team coverage, expected amounts, submitted UPI references, review decisions, statement-evidence references, refunds and audit history. Security and operational records include account activity, errors and administrative actions. This notice does not represent an approved certificate-issuance or physical-attendance tracking policy; any additional collection for those purposes needs a separate notice.',
    ],
  },
  {
    id: 'purposes',
    title: 'Why information is used',
    paragraphs: [
      'Account and academic information supports account verification, eligibility review and registration. Team and project records support collaboration, submissions and authorized judging. Email and in-app notifications support verification, recovery and event communications. Permission checks, audit trails and transaction review support security and fraud prevention.',
      'If payment collection is later authorized, payment records support exact order matching, independent receiving-account review, enrollment status, refund administration and financial accountability. Creating an account does not itself confirm event enrollment or a payment.',
    ],
  },
  {
    id: 'google-sign-in',
    title: 'Google authentication',
    paragraphs: [
      'Participant authentication currently uses email and password. Google Sign-In is disabled in the active authentication configuration. No participant Gmail permission is requested through registration or sign-in.',
      'If Google Sign-In is enabled later, its profile fields, scopes, account-linking behavior and notice must first be reviewed and disclosed. A future Google sign-in permission must remain separate from permission to read a finance mailbox.',
    ],
  },
  {
    id: 'google-api',
    title: 'Google API Data Access and Limited Use',
    paragraphs: [
      'The separate finance-mailbox integration is disabled pending verified credentials, mailbox permission and operational approval. Its implemented authorization scope is https://www.googleapis.com/auth/gmail.readonly. Only an authorized administrator can connect an allowlisted mailbox. This scope technically permits reading mailbox content; the application narrows polling to a configured label and relevant notification candidates.',
      'When enabled after review, message headers and text/HTML content are processed to identify incoming-credit notifications. Extracted records include message identifiers, authentication results, amount, provider transaction reference, UTR, transaction time, beneficiary association and a masked sender name. Updated wallet balance is informational and is kept separate from the amount received. Alerts are candidate evidence, never independent confirmation of settled funds.',
      'The reconciliation module does not persist raw Gmail bodies. It retains parsed metadata, content hashes and masked or encrypted transaction references in the database. No approved retention period or automated deletion schedule exists for those records. The polling lookback window is not a data-retention period.',
      'Mailbox refresh tokens are encrypted at rest by this module; access tokens are held in server memory with expiry handling. Disconnecting removes the locally stored refresh token and stops access, but does not erase retained financial metadata or revoke the grant at Google. The mailbox owner can also remove access through their Google Account permissions.',
      'The reviewed reconciliation flow has no advertising, unrelated analytics or AI-training use of Gmail data. Its intended use is limited to authorized reconciliation and associated security review. Google API Services User Data Policy and its Limited Use requirements must govern any enabled integration. This draft is not a certification that all provider, deletion, transfer and operational requirements have been satisfied. A separate optional send-only mail adapter is distinct from finance-mailbox read access.',
    ],
  },
  {
    id: 'payments',
    title: 'Payment and refund information',
    paragraphs: [
      'Real collection is disabled. The intended approved pricing model is one fixed fee per locked team, paid by its leader. The fee, receiving commercial-use account, tax treatment and payment/refund/cancellation policies remain unapproved or unconfigured. A personal FamApp wallet is not presented as an approved commercial collection account.',
      'Submitting a UTR or matching a Gmail alert does not mark an order paid. The implementation requires independent receiving-account credit confirmation through authorized manual statement review, checking the exact amount, unique reference, beneficiary, ownership and transaction time. Refunds require separate authorized review and outgoing-payment evidence; the website does not itself transfer funds.',
    ],
  },
  {
    id: 'sharing',
    title: 'Access and sharing',
    paragraphs: [
      'Authorized organizers access records according to their roles. Team collaboration exposes relevant team and project information to teammates. Assigned judges and permitted volunteers receive access needed for their workflows; this is not a promise that every profile field is private to the participant. Public event or leaderboard features may display participant or team names and results.',
      'Hosting, database, queue, file and email infrastructure process information needed to operate the service. Google processes an authorized mailbox connection when enabled. Production providers, locations, contractual safeguards and any cross-border processing still require organizer review. Requests from authorities must be assessed under applicable law; no blanket promise of non-disclosure is made.',
    ],
  },
  {
    id: 'retention',
    title: 'Retention and deletion',
    paragraphs: [
      'There is no approved retention schedule for accounts, submissions, consent records, financial records, audit history or backups. Financial history is deliberately preserved; the current implementation does not offer automatic whole-account erasure. Expired authentication tokens cannot be reused, but expiry does not itself establish database deletion.',
      'Completed and failed email-queue jobs use cleanup settings of one hour and a count limit of 100. Cleanup depends on queue operation; this is not a retention guarantee for delivered emails, database records or backups.',
      'For access, correction or deletion requests, contact the published event inbox and identify the account and request without sending passwords, OTPs or unredacted financial statements. Organizers must verify identity and assess records that need to be retained. Response deadlines, escalation and backup deletion procedures need approval; this draft does not promise an unimplemented self-service process.',
    ],
  },
  {
    id: 'security',
    title: 'Security safeguards',
    paragraphs: [
      'Verified safeguards include hashed passwords, expiring verification and recovery credentials, server-side session checks, role-based access controls and payment review audit trails. The reconciliation module encrypts refresh tokens and sensitive evidence references and uses hashed identifiers for duplicate checks. These safeguards do not imply that all database fields or backups are encrypted.',
      'No service can guarantee absolute security. Production access reviews, hosting safeguards, incident response and provider agreements remain deployment review requirements. Please report suspected account compromise to the organizing team without including credentials.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies, browser storage and analytics',
    paragraphs: [
      'Authentication uses Auth.js session and security cookies, with a configured 30-minute JWT session lifetime and backend session validation. Cookie security depends on the deployment, including HTTPS. Signing out invalidates the backend session through the implemented logout flow.',
      'Registration uses session storage for a draft of non-password fields and verification-delivery state. Submission drafts and content synchronization settings use local storage. Browser storage can remain on a shared device until it is cleared; avoid shared-device drafts containing personal information.',
      'The reviewed analytics helper writes interaction events to an in-browser dataLayer and logs them to the development console. It does not itself transmit events to an analytics service. A future tag manager, advertising tracker or analytics provider would need a separate review and disclosure; this draft is not a guarantee about an unaudited production host.',
      'The dashboard also keeps up to 200 interaction events in local storage unless its analytics preference is set to denied. The reviewed helper does not transmit those events to a remote collector; the stored events and preference can be removed by clearing site storage.',
    ],
  },
  {
    id: 'students',
    title: 'Children’s and student privacy',
    paragraphs: [
      'Student status does not establish that a participant is 18 or older. The current registration flow has no verified age check or parental-consent workflow. Under-18 participation and the appropriate safeguards require organizer and legal approval before relying on this flow for children. A student declaration does not replace that review.',
      'Public information can be viewed without an account. Real paid enrollment remains unavailable to everyone, including under-18 applicants, while age eligibility, guardian consent and collection approvals remain unresolved.',
      'India’s DPDP framework defines a child as a person under 18 and has staged commencement. As reviewed on 8 November 2026, its core processing, rights and child-data provisions are scheduled for later commencement; this page does not claim they are already fully operative or that the platform complies. Other applicable law must also be assessed. Organizers must review age assurance, parental permission and any claimed educational exemption rather than assume one applies.',
    ],
  },
  {
    id: 'rights',
    title: 'Requests, consent and grievances',
    paragraphs: [
      'You may ask the organizers about your records, request a correction or deletion, raise a privacy concern, or ask to withdraw consent for further processing. Withdrawal can affect the ability to maintain an account or participate and does not itself erase financial or security history. The appropriate legal basis, exceptions and handling procedure require operator approval.',
      'Registration declarations are recorded, but no complete automated consent-withdrawal or statutory grievance workflow is implemented. Applicable rights and legal deadlines depend on the law in force. The general event inbox below is the available contact, pending designation of a responsible privacy/grievance officer.',
    ],
  },
  {
    id: 'updates',
    title: 'Updates and contact',
    paragraphs: [
      'Version 0.1 was last updated on 8 November 2026 for organizer and legal review. No effective date has been approved. Material changes, including any newly enabled Google integration or collection purpose, require a reviewed notice and any necessary fresh permission before use.',
      'General event contact: iotclub.siet@gmail.com. Please use “NIRAL privacy request” in the subject. The organizing team’s identity, legal responsibility and grievance arrangements must be confirmed before this draft becomes the published operative policy.',
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction and document status',
    paragraphs: [
      'These draft terms describe use of the NIRAL Hackathon 2026 website for accounts, event registration, teams, submissions and administration. They are provided for organizer/legal review, with no approved effective date. Existing registration declarations are not being reinterpreted as acceptance of this new draft. An approved acceptance process must be established before these terms are relied on as a contract.',
    ],
  },
  {
    id: 'organizer',
    title: 'Organizer and eligibility',
    paragraphs: [
      'The website identifies IoT Club, Sri Shakthi Institute of Engineering and Technology as the organizing team. The legally responsible contracting entity, address and authorized representative are awaiting confirmation.',
      'The active registration flow is intended for students and records academic details and an eligibility declaration. The public rules contain provisional guidance with broader eligibility wording. Final eligible categories, verification, age requirements and under-18 permission must be reconciled and published by organizers. Do not assume college enrollment establishes adult status.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts and registration',
    paragraphs: [
      'Provide accurate account and academic information, verify your email and protect your password and verification codes. Use your own account and notify the organizers if it is compromised. Account creation is separate from event enrollment; dashboard status and organizer confirmation determine participation.',
      'Registration requires separate, initially unchecked declarations concerning rules, privacy, conduct and eligibility. This draft does not add a pre-checked agreement or change existing recorded declaration versions.',
    ],
  },
  {
    id: 'teams',
    title: 'Team creation and joining',
    paragraphs: [
      'Team membership, invitations and joining are managed through authorized accounts and the applicable event configuration. The current public configuration specifies teams of 2–4. Confirm the final roster and eligibility before enrollment.',
      'For approved team pricing, the leader pays one fixed fee covering the locked roster. Billing locks membership and leadership to preserve coverage and financial history. Organizers must publish the process for exceptional roster changes and disputes; do not assume a payment covers people added outside that roster.',
    ],
  },
  {
    id: 'conduct',
    title: 'Event rules and conduct',
    paragraphs: [
      'Read the linked event rules and follow authorized event instructions. Treat participants, volunteers and judges respectfully; do not harass, discriminate, impersonate another person, access accounts without permission, interfere with the service or submit false registration or payment evidence.',
      'Published eligibility, submission and judging guidance is marked provisional pending organizer publication. Final deadlines, AI-tool permissions, misconduct review, disqualification and appeal procedures need organizer approval. Contact organizers about a disputed decision; this draft creates no new appeal deadline or automatic penalty.',
    ],
  },
  {
    id: 'submissions',
    title: 'Submissions, originality and intellectual property',
    paragraphs: [
      'Submit project information and files through the official workflow and follow the published event requirements once confirmed. Identify third-party work, respect its licenses and do not misrepresent another person’s work as your own. Do not upload confidential, unlawful or unauthorized personal information.',
      'The website supports storing, sharing within authorized workflows and judging submitted material. This draft does not assign your intellectual property to the organizer or create an unrestricted publication license. Ownership, evaluation permission, promotional use, open-source expectations and treatment of existing work must be approved and disclosed before relying on them.',
    ],
  },
  {
    id: 'judging',
    title: 'Judging, prizes and sponsorship',
    paragraphs: [
      'The platform supports assigned judges, scores and notes. The public rules list innovation, technical depth, scalability, presentation and real-world impact as provisional criteria. Organizers must confirm the final rubric, conflicts process and decision/appeal procedure.',
      'No prize, sponsor benefit, award value, certificate, reimbursement or tax outcome is guaranteed by this draft. Organizers must publish confirmed award conditions and eligibility before participants rely on them.',
    ],
  },
  {
    id: 'fees',
    title: 'Registration fees and payment obligations',
    paragraphs: [
      'Real collection remains disabled. No fee amount, tax treatment, commercial-use receiving account or final collection policy has been approved in this document. Do not send fees to a personal FamApp wallet on the basis of this page.',
      'Any future fee must be approved by an authorized organizer, shown with the applicable version and policies before payment, and collected through an authorized account. The intended team model is one fixed fee per locked team, paid by its leader; creating a student account does not create an undisclosed payment obligation.',
    ],
  },
  {
    id: 'verification',
    title: 'Custom UPI verification',
    paragraphs: [
      'An order records the expected amount and covered registration. A submitted UTR or email notification is only a claim or candidate match. Paid enrollment requires independent credit confirmation for the correct receiving account, exact amount, unique reference and transaction ownership/time.',
      'Authorized manual statement review is retained. Duplicate references, mismatched amounts or incomplete evidence can require further review. Do not fabricate receipts or reuse someone else’s transaction. The website is not a bank and does not initiate UPI transfers.',
    ],
  },
  {
    id: 'refunds',
    title: 'Cancellation and refunds',
    paragraphs: [
      'Refund eligibility, cancellation deadlines, deductions, payment timing and applicable taxes are awaiting organizer approval. No non-refundable fee, refund promise or deadline is created here. Approved payment, refund and cancellation policies must be configured and presented before collection.',
      'The implementation records authorized manual refund review and outgoing-transfer evidence with an audit trail. A refund request or recorded review is not evidence that money has been transferred. Contact organizers about disputed or mistaken payments without publicly sharing account details.',
    ],
  },
  {
    id: 'schedule',
    title: 'Schedule and event changes',
    paragraphs: [
      'The public site currently advertises 3–4 December 2026 at Sri Shakthi Institute of Engineering and Technology. Final operational details should be checked in official schedule updates and with organizers. A notice and remedy procedure for postponement or cancellation still requires approval; this draft gives no unlimited right to change paid arrangements.',
    ],
  },
  {
    id: 'platform',
    title: 'Platform use and availability',
    paragraphs: [
      'Use the platform for the event and its authorized account, team and project workflows. Do not exploit vulnerabilities, bypass permission checks, scrape restricted records, upload malicious files or disrupt access. External links and services have their own terms.',
      'Maintenance, network failures or third-party outages can affect availability. Contact organizers if an outage affects a deadline. No guaranteed uptime, exclusion of statutory rights, liability cap or waiver of legal remedies is created by this draft.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and user content',
    paragraphs: [
      'The linked Privacy Policy review draft explains the current information flows, browser storage, role-based sharing, disabled Google integrations and unresolved retention arrangements. Public or team features can expose the information you submit within those workflows; check the intended audience before posting.',
      'Do not include passwords, OTPs, personal bank information or unrelated confidential material in team documents or project submissions. Any proposed public showcasing or promotional reuse needs approved permissions and notice.',
    ],
  },
  {
    id: 'suspension',
    title: 'Suspension and account closure',
    paragraphs: [
      'The platform supports role and account-status restrictions and session revocation. Organizers may need to investigate suspected misuse or secure a compromised account. The authority, notice, review and appeal process for suspension or termination must be approved before a final contractual policy is published.',
      'Account closure must be considered separately from retention of consent, payment, refund and security records. This draft promises neither immediate automatic erasure nor loss of lawful participant remedies.',
    ],
  },
  {
    id: 'law',
    title: 'Applicable law and disputes',
    paragraphs: [
      'The event operates in India. The contracting entity, applicable-law wording, court jurisdiction and dispute-resolution procedure require organizer/legal confirmation. This draft does not impose arbitration, an exclusive court or a waiver of statutory protections. Direct questions or concerns first to the published event inbox.',
    ],
  },
  {
    id: 'updates',
    title: 'Updates and official contact',
    paragraphs: [
      'Version 0.1 was last updated on 8 November 2026; its effective date is pending approval. Organizers must approve final terms, resolve the review items and establish how material changes and acceptance will be communicated.',
      'General event contact: iotclub.siet@gmail.com. This is the existing website contact, pending confirmation of the legal operator and designated grievance contact.',
    ],
  },
];
