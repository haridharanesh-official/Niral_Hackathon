-- CreateEnum
CREATE TYPE "UpiState" AS ENUM ('ALERT_MATCHED', 'PENDING', 'CLAIM_SUBMITTED', 'AWAITING_CREDIT_VERIFICATION', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "paymentProvider" TEXT NOT NULL DEFAULT 'MANUAL_UPI';

-- AlterTable
ALTER TABLE "event_enrollments" ADD COLUMN     "paymentProviderSnapshot" TEXT NOT NULL DEFAULT 'MANUAL_UPI';

-- AlterTable
ALTER TABLE "payment_orders" ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "teamNameSnapshot" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'MANUAL_UPI';

-- AlterTable
ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" SET DEFAULT 'MANUAL_UPI';

-- CreateTable
CREATE TABLE "upi_reconciliations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "state" "UpiState" NOT NULL DEFAULT 'PENDING',
    "beneficiary" TEXT NOT NULL,
    "utrHash" TEXT,
    "utrMasked" TEXT,
    "utrEncrypted" TEXT,
    "claimedAt" TIMESTAMP(3),
    "creditReferenceHash" TEXT,
    "creditReferenceMasked" TEXT,
    "creditEvidenceEncrypted" TEXT,
    "creditedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upi_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upi_credit_notifications" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "template" TEXT,
    "authentication" TEXT NOT NULL,
    "senderMasked" TEXT,
    "disposition" TEXT NOT NULL,
    "amountMinor" INTEGER,
    "utrHash" TEXT,
    "utrMasked" TEXT,
    "beneficiary" TEXT,
    "direction" TEXT,
    "transactionStatus" TEXT,
    "transactionAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "caseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upi_credit_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upi_manual_refunds" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "evidenceHash" TEXT,
    "outgoingUtrHash" TEXT,
    "evidenceMasked" TEXT,
    "evidenceEncrypted" TEXT,

    CONSTRAINT "upi_manual_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_mailboxes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "connectedBy" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPollAt" TIMESTAMP(3),
    "lastError" TEXT,
    "pollLeaseUntil" TIMESTAMP(3),
    "pageToken" TEXT,
    "scanStartedAt" TIMESTAMP(3),
    "scanQuery" TEXT,

    CONSTRAINT "reconciliation_mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_oauth_states" (
    "stateHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "verifierEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "reconciliation_oauth_states_pkey" PRIMARY KEY ("stateHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "upi_reconciliations_orderId_key" ON "upi_reconciliations"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "upi_reconciliations_utrHash_key" ON "upi_reconciliations"("utrHash");

-- CreateIndex
CREATE UNIQUE INDEX "upi_reconciliations_creditReferenceHash_key" ON "upi_reconciliations"("creditReferenceHash");

-- CreateIndex
CREATE INDEX "upi_reconciliations_state_updatedAt_idx" ON "upi_reconciliations"("state", "updatedAt");

-- CreateIndex
CREATE INDEX "upi_credit_notifications_utrHash_idx" ON "upi_credit_notifications"("utrHash");

-- CreateIndex
CREATE INDEX "upi_credit_notifications_disposition_createdAt_idx" ON "upi_credit_notifications"("disposition", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "upi_credit_notifications_mailboxId_gmailMessageId_key" ON "upi_credit_notifications"("mailboxId", "gmailMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "upi_manual_refunds_caseId_key" ON "upi_manual_refunds"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "upi_manual_refunds_evidenceHash_key" ON "upi_manual_refunds"("evidenceHash");

-- CreateIndex
CREATE UNIQUE INDEX "upi_manual_refunds_outgoingUtrHash_key" ON "upi_manual_refunds"("outgoingUtrHash");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_mailboxes_email_key" ON "reconciliation_mailboxes"("email");

-- AddForeignKey
ALTER TABLE "upi_reconciliations" ADD CONSTRAINT "upi_reconciliations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upi_credit_notifications" ADD CONSTRAINT "upi_credit_notifications_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "upi_reconciliations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upi_manual_refunds" ADD CONSTRAINT "upi_manual_refunds_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "upi_reconciliations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep original financial records and provider IDs. Only new defaults change.
-- Previously paid enrollments without an order require explicit review, never silent rerouting.
UPDATE "event_enrollments" e SET "paymentProviderSnapshot" = COALESCE(
  (SELECT p."provider" FROM "payment_orders" p WHERE p."enrollmentId" = e."id"), 'LEGACY_DISABLED')
WHERE e."paymentModeSnapshot" = 'PAID';
ALTER TABLE "payment_orders" DROP CONSTRAINT "payment_order_environment_valid";
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_order_environment_valid"
  CHECK ("environment" IN ('test','live') AND "provider" IN ('RAZORPAY','MANUAL_UPI','FAMAPP_SANDBOX')
    AND ("provider" = 'RAZORPAY' OR "environment" = 'test'));
ALTER TABLE "upi_manual_refunds" ADD CONSTRAINT "upi_refund_positive_amount" CHECK ("amountMinor" > 0);
ALTER TABLE "upi_credit_notifications" ADD CONSTRAINT "upi_alert_positive_amount" CHECK ("amountMinor" IS NULL OR "amountMinor" > 0);
