import type {
  EvaluationStatus,
  JudgeAssignmentStatus,
  JudgeBookmarkLabel,
  RubricCriterion,
} from "@hackos/shared";

export interface JudgeDashboard {
  judge: { id: string; name: string };
  stats: {
    assigned: number;
    reviewed: number;
    pending: number;
    avgReviewMinutes: number;
    currentRound: string;
  };
  schedule: Array<{
    id: string;
    time: string | null;
    projectTitle: string;
    teamName: string;
  }>;
}

export interface JudgeAssignmentItem {
  id: string;
  projectId: string;
  projectTitle: string;
  teamName: string;
  theme?: string | null;
  timeSlot?: string | null;
  status: JudgeAssignmentStatus;
  submissionVersion: number;
  reviewProgress: number;
  evaluationStatus: EvaluationStatus;
  bookmarks: JudgeBookmarkLabel[];
  round: string;
  priority: number;
}

export interface JudgeWorkspace {
  assignment: {
    id: string;
    status: JudgeAssignmentStatus;
    round: string;
    timeSlot?: string | null;
    reviewProgress: number;
  };
  project: {
    id: string;
    title: string;
    category?: string | null;
    executiveSummary?: string | null;
    problemStatement?: string | null;
    innovationSummary?: string | null;
    solutionSummary?: string | null;
    expectedImpact?: string | null;
    description?: string | null;
    technologies: string[];
    submittedAt?: string | null;
    version: number;
    githubUrl?: string | null;
    demoUrl?: string | null;
    slidesUrl?: string | null;
    logoUrl?: string | null;
    files: Array<{
      id: string;
      name: string;
      url: string;
      category: string;
      mimeType: string;
    }>;
  };
  team: {
    name: string;
    theme?: string | null;
    members: Array<{
      id: string;
      name: string;
      college?: string | null;
      department?: string | null;
    }>;
    leader?: { id: string; name: string } | null;
    mentorId?: string | null;
  };
  evaluation: {
    id: string;
    innovation: number;
    technical: number;
    presentation: number;
    scalability: number;
    impact: number;
    ui: number;
    business: number;
    comments?: string | null;
    status: EvaluationStatus;
    progressPercent: number;
    sectionsCompleted?: unknown;
    lastSavedAt?: string | null;
    submittedAt?: string | null;
  };
  note: string;
  bookmarks: JudgeBookmarkLabel[];
  rubric: RubricCriterion[];
  config: {
    anonymousJudging: boolean;
    allowDownloads: boolean;
  };
  history: Array<{
    at: string;
    action: string;
    metadata?: unknown;
  }>;
}

export type JudgeScores = Record<
  "innovation" | "technical" | "presentation" | "scalability" | "impact" | "ui" | "business",
  number
>;
