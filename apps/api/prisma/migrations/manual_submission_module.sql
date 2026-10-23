-- Submission Module migration (run via: npm run db:migrate)

-- Extend SubmissionStatus enum
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'VALIDATION';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_SUBMISSION';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'REVIEWED';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'RESULTS_PUBLISHED';

-- New enums
CREATE TYPE "DeliverableCategory" AS ENUM (
  'DOCUMENTS', 'SOURCE_CODE', 'IMAGES', 'VIDEOS',
  'HARDWARE', 'RESEARCH', 'PRESENTATION', 'DEPLOYMENT'
);

CREATE TYPE "FileValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID');

CREATE TYPE "ComplianceDeclaration" AS ENUM (
  'ORIGINAL_WORK', 'EVENT_RULES', 'REQUIRED_DOCUMENTS',
  'TEAM_VERIFIED', 'IP_DECLARATION', 'DEMO_VIDEO'
);

-- Extend submissions table
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "executiveSummary" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "problemStatement" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "objectives" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "innovationSummary" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "solutionSummary" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "expectedImpact" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "slidesUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "teamPhotoUrl" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "repositoryType" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "readinessScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "currentVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "lastSavedAt" TIMESTAMP(3);
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "receiptId" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "validationReport" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "submissions_receiptId_key" ON "submissions"("receiptId");

-- Extend submission_files
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "category" "DeliverableCategory" NOT NULL DEFAULT 'DOCUMENTS';
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "requirementKey" TEXT;
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "validationStatus" "FileValidationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "validationMessage" TEXT;
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "versionNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "uploadedById" TEXT;
ALTER TABLE "submission_files" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- New tables
CREATE TABLE IF NOT EXISTS "submission_versions" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "authorId" TEXT,
  "changeSummary" TEXT,
  "snapshot" JSONB NOT NULL,
  "modifiedDeliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "submission_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "submission_compliance" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "declaration" "ComplianceDeclaration" NOT NULL,
  "accepted" BOOLEAN NOT NULL DEFAULT false,
  "acceptedById" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "submission_compliance_pkey" PRIMARY KEY ("id")
);

-- Foreign keys and indexes (Prisma will reconcile exact names on migrate dev)
CREATE UNIQUE INDEX IF NOT EXISTS "submission_versions_submissionId_versionNumber_key"
  ON "submission_versions"("submissionId", "versionNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "submission_compliance_submissionId_declaration_key"
  ON "submission_compliance"("submissionId", "declaration");
