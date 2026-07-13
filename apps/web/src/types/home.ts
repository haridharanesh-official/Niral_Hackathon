/** Home page domain types consumed by APIs, services, and UI. */

export type SectionStatus = "idle" | "loading" | "success" | "empty" | "error";

export interface HomeEvent {
  id: string;
  name: string;
  logo: string;
  description: string;
  tagline: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string;
  capacity: number;
  filled: number;
  registrationStatus: "open" | "nearly_full" | "closed";
  prizePool: number;
}

export interface HomeStatistics {
  participants: number;
  teams: number;
  mentors: number;
  judges: number;
  sponsors: number;
  countries: number;
  prizePool: number;
  visitors: number;
  currentlyOnline: number;
  liveTeams: number;
  projectsStarted: number;
  mentorSessions: number;
  questionsAnswered: number;
  componentsIssued: number;
  announcementsToday: number;
  activeVolunteers: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  track?: string;
  college?: string;
  achievements?: string[];
}

export interface ThemeItem {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
  status: "active" | "draft";
  technologies: string[];
  sampleProjects: string[];
  architecture: string;
  hardware: string[];
  resources: { label: string; href: string }[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "high" | "emergency";
  publishedAt: string;
  expiresAt?: string | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  type: string;
  theme: string;
  college: string;
  tech: string;
  award: string;
  year: string;
  caption: string;
  tags: string[];
  mediaUrl?: string;
  tone: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SponsorItem {
  id: string;
  name: string;
  logo?: string;
  category: "Platinum" | "Gold" | "Silver" | "Community" | "Technology";
  website: string;
  description: string;
  careers: string;
  challenges: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  college: string;
  quote: string;
  rating: number;
  photo?: string;
  initials: string;
}

export interface RegistrationProgress {
  filled: number;
  capacity: number;
  percent: number;
  status: "open" | "nearly_full" | "closed";
}

export interface NewsletterPayload {
  name: string;
  email: string;
  interest: string;
  theme: string;
  consent: boolean;
}

export type AnalyticsEventName =
  | "hero_cta_clicked"
  | "registration_started"
  | "theme_viewed"
  | "sponsor_clicked"
  | "faq_expanded"
  | "gallery_opened"
  | "newsletter_subscribed"
  | "ai_assistant_launched";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props?: Record<string, string | number | boolean | undefined>;
}
