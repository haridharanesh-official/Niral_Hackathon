export enum UserRole {
  VISITOR = 'VISITOR',
  PARTICIPANT = 'PARTICIPANT',
  TEAM_LEADER = 'TEAM_LEADER',
  MENTOR = 'MENTOR',
  JUDGE = 'JUDGE',
  VOLUNTEER = 'VOLUNTEER',
  SPONSOR = 'SPONSOR',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export enum TeamStatus {
  FORMING = 'FORMING',
  ACTIVE = 'ACTIVE',
  SUBMITTED = 'SUBMITTED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  VALIDATION = 'VALIDATION',
  READY_FOR_SUBMISSION = 'READY_FOR_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  LOCKED = 'LOCKED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVIEWED = 'REVIEWED',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  SCORED = 'SCORED',
}

export enum DeliverableCategory {
  DOCUMENTS = 'DOCUMENTS',
  SOURCE_CODE = 'SOURCE_CODE',
  IMAGES = 'IMAGES',
  VIDEOS = 'VIDEOS',
  HARDWARE = 'HARDWARE',
  RESEARCH = 'RESEARCH',
  PRESENTATION = 'PRESENTATION',
  DEPLOYMENT = 'DEPLOYMENT',
}

export enum ComplianceDeclaration {
  ORIGINAL_WORK = 'ORIGINAL_WORK',
  EVENT_RULES = 'EVENT_RULES',
  REQUIRED_DOCUMENTS = 'REQUIRED_DOCUMENTS',
  TEAM_VERIFIED = 'TEAM_VERIFIED',
  IP_DECLARATION = 'IP_DECLARATION',
  DEMO_VIDEO = 'DEMO_VIDEO',
}

export enum QuizDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum QuizCategory {
  GENERAL = 'GENERAL',
  PROGRAMMING = 'PROGRAMMING',
  IOT = 'IOT',
  AI = 'AI',
  EMBEDDED = 'EMBEDDED',
  NETWORKING = 'NETWORKING',
  CYBERSECURITY = 'CYBERSECURITY',
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: { version: string };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  emailVerified?: boolean;
  xp?: number;
  rank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  teamId?: string;
  name: string;
  score: number;
  xp?: number;
  avatarUrl?: string | null;
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum EventMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
}

export interface NiralEventConfig {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  publicDescription?: string | null;
  tagline?: string | null;
  organizerName?: string | null;
  officialEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string;
  hasExactTimes: boolean;
  location?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  eventMode: EventMode;
  registrationStartsAt?: string | null;
  registrationEndsAt?: string | null;
  registrationEnabled: boolean;
  maxCapacity?: number | null;
  minTeamSize: number;
  maxTeamSize: number;
  prizePool?: number | null;
  status: EventStatus;
  isPublished: boolean;
  isActive: boolean;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  isActive: boolean;
  status?: EventStatus;
  isPublished?: boolean;
}

export const APP_NAME = 'NIRAL Hackathon 2026';
export const PUBLIC_BRAND = 'NIRAL 2026';
export const DEFAULT_EVENT_SLUG = 'niral-2026';
export const EVENT_DATES_DISPLAY = 'December 3–4, 2026';
export const EVENT_TIMEZONE = 'Asia/Kolkata';
export const APP_TAGLINE = 'The Future of Innovation Starts Here';
export const DEFAULT_PAGE_SIZE = 20;

export const AUTOMATION_EVENTS = {
  REGISTRATION_CREATED: 'registration.created',
  REGISTRATION_APPROVED: 'registration.approved',
  REGISTRATION_REJECTED: 'registration.rejected',
  TEAM_CREATED: 'team.created',
  TEAM_MEMBER_JOINED: 'team.member_joined',
  TEAM_COMPLETED: 'team.completed',
  ANNOUNCEMENT_PUBLISHED: 'announcement.published',
  EMAIL_SEND_REQUESTED: 'email.send_requested',
  EMAIL_DELIVERED: 'email.delivered',
  EMAIL_FAILED: 'email.failed',
} as const;

export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  [UserRole.VISITOR]: '/',
  [UserRole.PARTICIPANT]: '/dashboard',
  [UserRole.TEAM_LEADER]: '/dashboard/team',
  [UserRole.MENTOR]: '/dashboard/mentor',
  [UserRole.JUDGE]: '/dashboard/judge',
  [UserRole.VOLUNTEER]: '/dashboard/volunteer',
  [UserRole.SPONSOR]: '/dashboard/sponsor',
  [UserRole.ORGANIZER]: '/dashboard/organizer',
  [UserRole.ADMIN]: '/admin',
};

export const PHASES = [
  'Initialize',
  'Authentication',
  'Landing Page',
  'Dashboards',
  'Games',
  'Quiz Arena',
  'Leaderboard',
  'Admin',
  'Deployment',
] as const;

export const SKILL_CATALOG = [
  'Python',
  'Arduino',
  'Raspberry Pi',
  'ESP32',
  'Embedded C',
  'C++',
  'JavaScript',
  'React',
  'Node.js',
  'AI / ML',
  'Computer Vision',
  'Cloud Computing',
  'MQTT',
  'Docker',
  'PCB Design',
  'Robotics',
  'Cybersecurity',
] as const;

export const SKILL_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const INTEREST_DOMAINS = [
  'Industrial IoT',
  'Smart Agriculture',
  'Healthcare',
  'Smart Cities',
  'Robotics',
  'AI & ML',
  'Cybersecurity',
  'Cloud Computing',
  'Sustainability',
  'Assistive Technology',
] as const;

export const HACKATHON_THEMES = [
  'Industrial Automation',
  'Smart Agriculture',
  'Healthcare IoT',
  'Smart Cities',
  'Energy Management',
  'AI + IoT',
] as const;

export const DEFAULT_MIN_TEAM_SIZE = 2;
export const DEFAULT_MAX_TEAM_SIZE = 4;

export type ParticipationMode = 'ONLINE' | 'ONSITE' | 'HYBRID';

export type ParticipantType = 'student' | 'professional' | 'researcher';

export interface UserProfileData {
  participantType?: ParticipantType;
  personal?: {
    photoUrl?: string;
    dateOfBirth?: string;
    gender?: string;
    pronouns?: string;
    nationality?: string;
    language?: string;
    timezone?: string;
  };
  academic?: {
    institution?: string;
    department?: string;
    degree?: string;
    year?: string;
    studentId?: string;
  };
  professional?: {
    company?: string;
    role?: string;
    yearsExperience?: string;
    industry?: string;
  };
  research?: {
    organization?: string;
    domain?: string;
    publications?: string;
  };
  skills?: Record<string, SkillLevel>;
  customSkills?: string[];
  interests?: string[];
  portfolio?: {
    github?: string;
    linkedin?: string;
    website?: string;
    kaggle?: string;
    devpost?: string;
    researchgate?: string;
    resumeName?: string;
    bio?: string;
  };
}

export const ONBOARDING_CHECKLIST = [
  { key: 'account', label: 'Account Created' },
  { key: 'email', label: 'Email Verified' },
  { key: 'profile', label: 'Profile Completed' },
  { key: 'event', label: 'Event Registered' },
  { key: 'team', label: 'Team Joined' },
  { key: 'project', label: 'Project Submitted' },
  { key: 'presentation', label: 'Final Presentation' },
] as const;

/** API contract version (returned in response meta / X-API-Version). */
export const API_VERSION = '1';

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  /** bcrypt cost factor (adaptive hashing). */
  bcryptCost: 12,
} as const;

export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_POLICY.maxLength} characters`);
  }
  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(password)) {
    errors.push('Password must include an uppercase letter');
  }
  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(password)) {
    errors.push('Password must include a lowercase letter');
  }
  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must include a digit');
  }
  return errors;
}

export const Permission = {
  PROFILE_VIEW: 'profile.view',
  PROFILE_EDIT: 'profile.edit',
  PROFILE_UPLOAD_RESUME: 'profile.upload_resume',
  TEAM_CREATE: 'team.create',
  TEAM_INVITE: 'team.invite',
  TEAM_REMOVE_MEMBER: 'team.remove_member',
  TEAM_SUBMIT: 'team.submit',
  JUDGE_VIEW_SUBMISSIONS: 'judge.view_submissions',
  JUDGE_EVALUATE: 'judge.evaluate',
  EVENT_CREATE: 'event.create',
  EVENT_ANNOUNCE: 'event.announce',
  EVENT_MANAGE_USERS: 'event.manage_users',
  ADMIN_MANAGE_USERS: 'admin.manage_users',
  AUDIT_VIEW: 'audit.view',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const ALL_PROFILE: PermissionKey[] = [
  Permission.PROFILE_VIEW,
  Permission.PROFILE_EDIT,
  Permission.PROFILE_UPLOAD_RESUME,
];

/** Central RBAC matrix — source of truth for authorization checks. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionKey[]> = {
  [UserRole.VISITOR]: [Permission.PROFILE_VIEW],
  [UserRole.PARTICIPANT]: [
    ...ALL_PROFILE,
    Permission.TEAM_CREATE,
    Permission.TEAM_INVITE,
    Permission.TEAM_SUBMIT,
  ],
  [UserRole.TEAM_LEADER]: [
    ...ALL_PROFILE,
    Permission.TEAM_CREATE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE_MEMBER,
    Permission.TEAM_SUBMIT,
  ],
  [UserRole.MENTOR]: [...ALL_PROFILE],
  [UserRole.JUDGE]: [
    ...ALL_PROFILE,
    Permission.JUDGE_VIEW_SUBMISSIONS,
    Permission.JUDGE_EVALUATE,
  ],
  [UserRole.VOLUNTEER]: [...ALL_PROFILE],
  [UserRole.SPONSOR]: [...ALL_PROFILE],
  [UserRole.ORGANIZER]: [
    ...ALL_PROFILE,
    Permission.TEAM_CREATE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE_MEMBER,
    Permission.TEAM_SUBMIT,
    Permission.JUDGE_VIEW_SUBMISSIONS,
    Permission.JUDGE_EVALUATE,
    Permission.EVENT_CREATE,
    Permission.EVENT_ANNOUNCE,
    Permission.EVENT_MANAGE_USERS,
    Permission.AUDIT_VIEW,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

export function roleHasPermission(
  role: UserRole | string | undefined | null,
  permission: PermissionKey,
): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as UserRole];
  return Boolean(perms?.includes(permission));
}

export function okResponse<T>(
  data: T,
  message?: string,
): ApiResponse<T> & { meta: { version: string } } {
  return {
    success: true,
    data,
    message,
    meta: { version: API_VERSION },
  };
}

export function errorResponse(
  error: string,
  message?: string,
): ApiResponse & { meta: { version: string } } {
  return {
    success: false,
    error,
    message,
    meta: { version: API_VERSION },
  };
}

/** Default Kanban workflow columns for team project workspaces. */
export const KANBAN_COLUMNS = [
  { key: 'BACKLOG', label: 'Backlog', wipLimit: null as number | null },
  { key: 'READY', label: 'Ready', wipLimit: null },
  { key: 'IN_PROGRESS', label: 'In Progress', wipLimit: 4 },
  { key: 'CODE_REVIEW', label: 'Code Review', wipLimit: 3 },
  { key: 'TESTING', label: 'Testing', wipLimit: 3 },
  { key: 'DOCUMENTATION', label: 'Documentation', wipLimit: null },
  { key: 'READY_FOR_SUBMISSION', label: 'Ready for Submission', wipLimit: null },
  { key: 'COMPLETED', label: 'Completed', wipLimit: null },
] as const;

export type KanbanColumnKey = (typeof KANBAN_COLUMNS)[number]['key'];

export const TASK_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type TaskPriorityKey = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = [
  'FEATURE',
  'BUG',
  'IMPROVEMENT',
  'DOCUMENTATION',
  'HARDWARE',
  'RESEARCH',
  'TESTING',
  'MEETING',
] as const;
export type TaskTypeKey = (typeof TASK_TYPES)[number];

export const PRIORITY_META: Record<
  TaskPriorityKey,
  { label: string; color: string }
> = {
  CRITICAL: { label: 'Critical', color: '#ef4444' },
  HIGH: { label: 'High', color: '#f97316' },
  MEDIUM: { label: 'Medium', color: '#3b82f6' },
  LOW: { label: 'Low', color: '#9ca3af' },
};

export const TASK_TYPE_LABELS: Record<TaskTypeKey, string> = {
  FEATURE: 'Feature',
  BUG: 'Bug',
  IMPROVEMENT: 'Improvement',
  DOCUMENTATION: 'Documentation',
  HARDWARE: 'Hardware',
  RESEARCH: 'Research',
  TESTING: 'Testing',
  MEETING: 'Meeting',
};

export const PROJECT_WORKSPACE_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'kanban', label: 'Kanban Board' },
  { key: 'sprint', label: 'Sprint Planner' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'whiteboard', label: 'Whiteboard' },
  { key: 'docs', label: 'Documentation' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'risks', label: 'Risks' },
  { key: 'issues', label: 'Issues & Bugs' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'reports', label: 'Reports' },
  { key: 'ai-manager', label: 'AI Project Manager' },
] as const;

export type ProjectWorkspaceSection =
  (typeof PROJECT_WORKSPACE_SECTIONS)[number]['key'];

export const WHITEBOARD_ZOOM_LEVELS = [
  0.25, 0.5, 0.75, 1, 1.5, 2,
] as const;

export const WHITEBOARD_SHAPES = [
  'rectangle',
  'circle',
  'ellipse',
  'triangle',
  'diamond',
  'hexagon',
  'arrow',
  'line',
  'connector',
  'rounded-rectangle',
] as const;

export const WHITEBOARD_ENGINEERING = [
  'raspberry-pi',
  'esp32',
  'arduino',
  'sensor',
  'relay',
  'camera',
  'database',
  'server',
  'cloud',
  'user',
  'api-gateway',
] as const;

export const WHITEBOARD_CIRCUIT = [
  'resistor',
  'capacitor',
  'led',
  'microcontroller',
  'breadboard',
  'power-supply',
  'motor',
  'switch',
] as const;

export const WHITEBOARD_FLOWCHART = [
  'start',
  'process',
  'decision',
  'loop',
  'input',
  'output',
  'end',
] as const;

export const WHITEBOARD_TEMPLATES = [
  {
    id: 'mvc',
    label: 'MVC',
    category: 'software',
    objects: [
      { type: 'server', label: 'Controller', x: 200, y: 80 },
      { type: 'database', label: 'Model', x: 80, y: 220 },
      { type: 'user', label: 'View', x: 320, y: 220 },
    ],
  },
  {
    id: 'iot-gateway',
    label: 'IoT Gateway',
    category: 'hardware',
    objects: [
      { type: 'sensor', label: 'Sensors', x: 60, y: 160 },
      { type: 'esp32', label: 'ESP32', x: 220, y: 160 },
      { type: 'cloud', label: 'Cloud', x: 400, y: 160 },
      { type: 'server', label: 'Dashboard', x: 560, y: 160 },
    ],
  },
  {
    id: 'edge-ai',
    label: 'Edge AI',
    category: 'ai',
    objects: [
      { type: 'camera', label: 'Camera', x: 80, y: 140 },
      { type: 'raspberry-pi', label: 'Edge Device', x: 260, y: 140 },
      { type: 'server', label: 'Inference', x: 440, y: 140 },
      { type: 'cloud', label: 'Sync', x: 620, y: 140 },
    ],
  },
  {
    id: 'microservices',
    label: 'Microservices',
    category: 'software',
    objects: [
      { type: 'api-gateway', label: 'API Gateway', x: 280, y: 60 },
      { type: 'server', label: 'Auth Svc', x: 80, y: 200 },
      { type: 'server', label: 'Task Svc', x: 280, y: 200 },
      { type: 'database', label: 'DB', x: 480, y: 200 },
    ],
  },
] as const;

export const DOCUMENT_CATEGORIES = [
  { key: 'PROPOSAL', label: 'Project Proposal' },
  { key: 'RESEARCH', label: 'Research Documentation' },
  { key: 'TECHNICAL', label: 'Technical Documentation' },
  { key: 'TESTING', label: 'Testing Documentation' },
  { key: 'USER', label: 'User Documentation' },
  { key: 'PRESENTATION', label: 'Presentation Documentation' },
] as const;

export type DocumentCategoryKey =
  (typeof DOCUMENT_CATEGORIES)[number]['key'];

export const DOCUMENT_TEMPLATES = [
  {
    id: 'project-proposal',
    label: 'Project Proposal',
    category: 'PROPOSAL' as DocumentCategoryKey,
    content: `# Project Proposal

## Title

## Abstract

## Problem Statement

## Objectives

## Scope
`,
  },
  {
    id: 'system-architecture',
    label: 'System Architecture',
    category: 'TECHNICAL' as DocumentCategoryKey,
    content: `# System Architecture

## Overview

## Components

## Data Flow

## Deployment
`,
  },
  {
    id: 'api-spec',
    label: 'API Specification',
    category: 'TECHNICAL' as DocumentCategoryKey,
    content: `# API Specification

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/... | |

## Auth

## Errors
`,
  },
  {
    id: 'research-report',
    label: 'Research Report',
    category: 'RESEARCH' as DocumentCategoryKey,
    content: `# Research Report

## Literature Survey

## Existing Systems

## References

## Technical Notes
`,
  },
  {
    id: 'pitch-notes',
    label: 'Pitch Deck Notes',
    category: 'PRESENTATION' as DocumentCategoryKey,
    content: `# Pitch Deck Notes

## Demo Script

## Slide Outline

## Speaker Notes

## Anticipated Questions
`,
  },
] as const;

export const TIMELINE_EVENT_TYPES = [
  'TASK',
  'DOCUMENT',
  'MILESTONE',
  'DELIVERABLE',
  'WHITEBOARD',
  'AI',
  'ORGANIZER',
  'TEAM',
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const DEFAULT_MILESTONE_TITLES = [
  'Registration Complete',
  'Team Formed',
  'Theme Selected',
  'Architecture Approved',
  'Prototype Complete',
  'Testing Complete',
  'Documentation Complete',
  'Final Submission',
  'Presentation Delivered',
] as const;

export const SPRINT_TEMPLATES = [
  'Research Sprint',
  'Hardware Setup Sprint',
  'Firmware Development Sprint',
  'AI Model Sprint',
  'Testing Sprint',
  'Documentation Sprint',
  'Presentation Sprint',
] as const;

export const DELIVERABLE_TYPES = [
  'Source Code',
  'Circuit Diagram',
  'PCB Design',
  'Architecture Diagram',
  'Research Report',
  'User Manual',
  'Presentation Slides',
  'Demonstration Video',
] as const;

export const SUBMISSION_WORKSPACE_SECTIONS = [
  { key: 'dashboard', label: 'Status Dashboard' },
  { key: 'details', label: 'Project Details' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'source-code', label: 'Source Code' },
  { key: 'media', label: 'Media Gallery' },
  { key: 'demo-video', label: 'Demo Video' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'compliance', label: 'Compliance Checklist' },
  { key: 'validation', label: 'Validation Report' },
  { key: 'preview', label: 'Final Review' },
  { key: 'submit', label: 'Submit Project' },
] as const;

export type SubmissionWorkspaceSection =
  (typeof SUBMISSION_WORKSPACE_SECTIONS)[number]['key'];

export const DELIVERABLE_CATEGORIES: {
  key: DeliverableCategory;
  label: string;
  examples: string;
}[] = [
  { key: DeliverableCategory.DOCUMENTS, label: 'Documents', examples: 'PDF, DOCX' },
  { key: DeliverableCategory.SOURCE_CODE, label: 'Source Code', examples: 'Repository, ZIP' },
  { key: DeliverableCategory.IMAGES, label: 'Images', examples: 'PNG, JPEG, SVG' },
  { key: DeliverableCategory.VIDEOS, label: 'Videos', examples: 'MP4' },
  { key: DeliverableCategory.HARDWARE, label: 'Hardware', examples: 'Schematics, PCB Files' },
  { key: DeliverableCategory.RESEARCH, label: 'Research', examples: 'Papers, References' },
  { key: DeliverableCategory.PRESENTATION, label: 'Presentation', examples: 'PPTX, PDF' },
  { key: DeliverableCategory.DEPLOYMENT, label: 'Deployment', examples: 'Docker, Install Guide' },
];

export const COMPLIANCE_DECLARATIONS: {
  key: ComplianceDeclaration;
  label: string;
  mandatory: boolean;
}[] = [
  { key: ComplianceDeclaration.ORIGINAL_WORK, label: 'Original Work Declaration', mandatory: true },
  { key: ComplianceDeclaration.EVENT_RULES, label: 'Event Rules Accepted', mandatory: true },
  { key: ComplianceDeclaration.REQUIRED_DOCUMENTS, label: 'Required Documents Uploaded', mandatory: true },
  { key: ComplianceDeclaration.TEAM_VERIFIED, label: 'Team Information Verified', mandatory: true },
  { key: ComplianceDeclaration.IP_DECLARATION, label: 'Intellectual Property Declaration', mandatory: true },
  { key: ComplianceDeclaration.DEMO_VIDEO, label: 'Final Demo Video Uploaded', mandatory: false },
];

export const SUBMISSION_TECHNOLOGY_TAGS = [
  'React',
  'Next.js',
  'FastAPI',
  'Node.js',
  'PostgreSQL',
  'MongoDB',
  'Raspberry Pi',
  'ESP32',
  'MQTT',
  'TensorFlow',
  'OpenCV',
  'Docker',
  'Arduino',
  'Python',
  'TypeScript',
] as const;

export interface SubmissionRequirement {
  key: string;
  label: string;
  category: DeliverableCategory;
  mandatory: boolean;
  allowedMimeTypes?: string[];
  maxSizeMb?: number;
}

export interface EventSubmissionConfig {
  submissionDeadline?: string;
  allowEditAfterSubmit?: boolean;
  maxFileSizeMb?: number;
  requirements?: SubmissionRequirement[];
  showcaseVisibility?: 'private' | 'judges' | 'public';
}

export const DEFAULT_SUBMISSION_REQUIREMENTS: SubmissionRequirement[] = [
  { key: 'proposal', label: 'Proposal Uploaded', category: DeliverableCategory.DOCUMENTS, mandatory: true },
  { key: 'source_code', label: 'Source Code Linked', category: DeliverableCategory.SOURCE_CODE, mandatory: true },
  { key: 'architecture', label: 'Architecture Diagram', category: DeliverableCategory.DOCUMENTS, mandatory: true },
  { key: 'documentation', label: 'Documentation', category: DeliverableCategory.DOCUMENTS, mandatory: true },
  { key: 'presentation', label: 'Presentation Slides', category: DeliverableCategory.PRESENTATION, mandatory: true },
  { key: 'demo_video', label: 'Demo Video', category: DeliverableCategory.VIDEOS, mandatory: false },
];

export const SUBMISSION_LOCKED_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.SUBMITTED,
  SubmissionStatus.LOCKED,
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.REVIEWED,
  SubmissionStatus.RESULTS_PUBLISHED,
  SubmissionStatus.SCORED,
];

export enum EvaluationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

export enum JudgeAssignmentStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEWED = 'REVIEWED',
  DEFERRED = 'DEFERRED',
}

export enum JudgeBookmarkLabel {
  OUTSTANDING_INNOVATION = 'OUTSTANDING_INNOVATION',
  REQUIRES_FOLLOW_UP = 'REQUIRES_FOLLOW_UP',
  POTENTIAL_AWARD = 'POTENTIAL_AWARD',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION',
}

export const JUDGE_WORKSPACE_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'assigned', label: 'Assigned Projects' },
  { key: 'live', label: 'Live Evaluations' },
  { key: 'queue', label: 'Evaluation Queue' },
  { key: 'rubrics', label: 'Rubrics' },
  { key: 'notes', label: 'Notes' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'results', label: 'Results' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'settings', label: 'Settings' },
] as const;

export type JudgeWorkspaceSection =
  (typeof JUDGE_WORKSPACE_SECTIONS)[number]['key'];

export interface RubricCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface EventEvaluationConfig {
  currentRound?: string;
  anonymousJudging?: boolean;
  allowDownloads?: boolean;
  rubric?: RubricCriterion[];
}

export const DEFAULT_JUDGE_RUBRIC: RubricCriterion[] = [
  {
    key: 'innovation',
    label: 'Innovation',
    description: 'Novelty and creativity of the solution',
    weight: 1.2,
    maxScore: 10,
  },
  {
    key: 'technical',
    label: 'Technical Design',
    description: 'Architecture, implementation quality, and engineering depth',
    weight: 1.3,
    maxScore: 10,
  },
  {
    key: 'presentation',
    label: 'Presentation',
    description: 'Clarity of demo and communication',
    weight: 1.0,
    maxScore: 10,
  },
  {
    key: 'scalability',
    label: 'Scalability',
    description: 'Potential to grow beyond the hackathon prototype',
    weight: 0.9,
    maxScore: 10,
  },
  {
    key: 'impact',
    label: 'Impact',
    description: 'Real-world problem significance and outcomes',
    weight: 1.2,
    maxScore: 10,
  },
  {
    key: 'ui',
    label: 'User Experience',
    description: 'Interface design and usability',
    weight: 0.8,
    maxScore: 10,
  },
  {
    key: 'business',
    label: 'Business Viability',
    description: 'Market fit and sustainability',
    weight: 0.8,
    maxScore: 10,
  },
];

export const JUDGE_BOOKMARK_OPTIONS: {
  key: JudgeBookmarkLabel;
  label: string;
}[] = [
  { key: JudgeBookmarkLabel.OUTSTANDING_INNOVATION, label: 'Outstanding Innovation' },
  { key: JudgeBookmarkLabel.REQUIRES_FOLLOW_UP, label: 'Requires Follow-up' },
  { key: JudgeBookmarkLabel.POTENTIAL_AWARD, label: 'Potential Award' },
  { key: JudgeBookmarkLabel.NEEDS_CLARIFICATION, label: 'Needs Clarification' },
];

export const EVALUATION_PROGRESS_SECTIONS = [
  { key: 'innovation', label: 'Innovation' },
  { key: 'technical', label: 'Technical Design' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'final_score', label: 'Final Score' },
] as const;
