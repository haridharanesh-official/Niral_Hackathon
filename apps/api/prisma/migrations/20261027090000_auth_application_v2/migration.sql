-- Additive migration: no existing enrollment decisions or user security settings are rewritten.
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'WAITLISTED';
ALTER TABLE "event_enrollments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "event_enrollments" ALTER COLUMN "confirmationStatus" SET DEFAULT 'PENDING';
ALTER TABLE "event_enrollments" ADD COLUMN "applicationData" JSONB,
 ADD COLUMN "consentAcceptedAt" TIMESTAMP(3), ADD COLUMN "consentVersion" TEXT;
