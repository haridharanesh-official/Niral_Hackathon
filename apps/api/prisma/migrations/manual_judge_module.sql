-- Judge Evaluation Platform migration

CREATE TYPE "EvaluationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED');
CREATE TYPE "JudgeAssignmentStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'REVIEWED', 'DEFERRED');
CREATE TYPE "JudgeBookmarkLabel" AS ENUM (
  'OUTSTANDING_INNOVATION', 'REQUIRES_FOLLOW_UP', 'POTENTIAL_AWARD', 'NEEDS_CLARIFICATION'
);

ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "status" "EvaluationStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "progressPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "sectionsCompleted" JSONB;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "draftData" JSONB;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "lastSavedAt" TIMESTAMP(3);

-- Add FK for judgeId if missing
-- ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "judge_assignments" (
  "id" TEXT NOT NULL,
  "judgeId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "eventId" TEXT,
  "round" TEXT NOT NULL DEFAULT 'Technical Evaluation',
  "timeSlot" TIMESTAMP(3),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" "JudgeAssignmentStatus" NOT NULL DEFAULT 'WAITING',
  "reviewProgress" INTEGER NOT NULL DEFAULT 0,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "judge_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "judge_notes" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "judgeId" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "judge_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "judge_bookmarks" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "judgeId" TEXT NOT NULL,
  "label" "JudgeBookmarkLabel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "judge_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "judge_assignments_judgeId_submissionId_key"
  ON "judge_assignments"("judgeId", "submissionId");
CREATE UNIQUE INDEX IF NOT EXISTS "judge_notes_assignmentId_judgeId_key"
  ON "judge_notes"("assignmentId", "judgeId");
CREATE UNIQUE INDEX IF NOT EXISTS "judge_bookmarks_assignmentId_judgeId_label_key"
  ON "judge_bookmarks"("assignmentId", "judgeId", "label");
