import type {
  ComplianceDeclaration,
  DeliverableCategory,
  EventSubmissionConfig,
  SubmissionStatus,
  SubmissionWorkspaceSection,
} from "@hackos/shared";

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  category: DeliverableCategory;
  requirementKey?: string | null;
  validationStatus: "PENDING" | "VALID" | "INVALID";
  validationMessage?: string | null;
  versionNumber: number;
  createdAt: string;
}

export interface SubmissionCompliance {
  id: string;
  declaration: ComplianceDeclaration;
  accepted: boolean;
  acceptedAt?: string | null;
}

export interface SubmissionData {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  executiveSummary?: string | null;
  problemStatement?: string | null;
  objectives?: string | null;
  innovationSummary?: string | null;
  solutionSummary?: string | null;
  expectedImpact?: string | null;
  technologies: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  slidesUrl?: string | null;
  logoUrl?: string | null;
  teamPhotoUrl?: string | null;
  repositoryType?: string | null;
  readinessScore: number;
  currentVersion: number;
  status: SubmissionStatus;
  submittedAt?: string | null;
  lockedAt?: string | null;
  lastSavedAt?: string | null;
  receiptId?: string | null;
  files: SubmissionFile[];
  compliance: SubmissionCompliance[];
  versions: Array<{
    versionNumber: number;
    changeSummary?: string | null;
    createdAt: string;
    modifiedDeliverables: string[];
  }>;
}

export interface ValidationItem {
  key: string;
  category: string;
  label: string;
  passed: boolean;
  message?: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationReport {
  passed: boolean;
  items: ValidationItem[];
  readinessScore: number;
  canSubmit: boolean;
  checkedAt: string;
}

export interface ReadinessCheckItem {
  key: string;
  label: string;
  mandatory: boolean;
  complete: boolean;
}

export interface SubmissionWorkspace {
  submission: SubmissionData;
  team: {
    id: string;
    name: string;
    slug: string;
    theme?: string | null;
    members: Array<{ id: string; name: string; image?: string | null; role: string }>;
    leader?: { id: string; name: string; image?: string | null } | null;
  };
  event?: {
    id: string;
    name: string;
    slug: string;
    endsAt: string;
  } | null;
  config: EventSubmissionConfig;
  validation?: ValidationReport | null;
  deadline?: string | null;
  checklist: ReadinessCheckItem[];
}

export type { SubmissionWorkspaceSection };
