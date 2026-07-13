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
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SCORED = 'SCORED',
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

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  isActive: boolean;
}

export const APP_NAME = 'HackOS';
export const APP_TAGLINE = 'The Future of Innovation Starts Here';
export const DEFAULT_PAGE_SIZE = 20;

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
