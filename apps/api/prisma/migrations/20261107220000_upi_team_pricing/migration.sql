-- AlterTable
ALTER TABLE "events" ADD COLUMN     "cancellationPolicyUrl" TEXT;

-- AlterTable
ALTER TABLE "event_enrollments" ADD COLUMN     "feeScopeSnapshot" TEXT NOT NULL DEFAULT 'PARTICIPANT';

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "billingLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment_orders" ADD COLUMN     "billingTeamId" TEXT;

-- AlterTable
ALTER TABLE "upi_credit_notifications" ADD COLUMN     "balanceMinor" INTEGER,
ADD COLUMN     "providerTransactionEncrypted" TEXT,
ADD COLUMN     "providerTransactionHash" TEXT,
ADD COLUMN     "providerTransactionMasked" TEXT,
ADD COLUMN     "senderDisplayMasked" TEXT;

-- CreateTable
CREATE TABLE "payment_coverage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,

    CONSTRAINT "payment_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upi_credit_deliveries" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upi_credit_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_coverage_enrollmentId_key" ON "payment_coverage"("enrollmentId");

-- CreateIndex
CREATE INDEX "payment_coverage_orderId_idx" ON "payment_coverage"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "upi_credit_deliveries_mailboxId_gmailMessageId_key" ON "upi_credit_deliveries"("mailboxId", "gmailMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_billingTeamId_key" ON "payment_orders"("billingTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "upi_credit_notifications_providerTransactionHash_key" ON "upi_credit_notifications"("providerTransactionHash");

-- AddForeignKey
ALTER TABLE "payment_coverage" ADD CONSTRAINT "payment_coverage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_coverage" ADD CONSTRAINT "payment_coverage_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "event_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upi_credit_deliveries" ADD CONSTRAINT "upi_credit_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "upi_credit_notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Serialize roster mutations with shared checkout creation and preserve the billed roster.
CREATE FUNCTION niral_protect_billed_roster() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id text;
BEGIN
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."teamId" ELSE NEW."teamId" END;
  PERFORM "id" FROM "teams" WHERE "id" = target_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM "payment_orders" WHERE "billingTeamId" = target_id)
     OR (TG_OP = 'UPDATE' AND EXISTS (SELECT 1 FROM "payment_orders" WHERE "billingTeamId" = OLD."teamId")) THEN
    RAISE EXCEPTION 'Billed team roster is locked; finance review required';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "protect_billed_roster" BEFORE INSERT OR UPDATE OR DELETE ON "team_members"
  FOR EACH ROW EXECUTE FUNCTION niral_protect_billed_roster();
CREATE FUNCTION niral_protect_billed_team() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payment_orders" WHERE "billingTeamId" = OLD."id") THEN
    RAISE EXCEPTION 'Billed team identity is locked; financial records must be preserved';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "protect_billed_team_delete" BEFORE DELETE ON "teams" FOR EACH ROW EXECUTE FUNCTION niral_protect_billed_team();
CREATE TRIGGER "protect_billed_team_owner" BEFORE UPDATE OF "leaderId", "eventId" ON "teams" FOR EACH ROW WHEN (OLD."leaderId" IS DISTINCT FROM NEW."leaderId" OR OLD."eventId" IS DISTINCT FROM NEW."eventId") EXECUTE FUNCTION niral_protect_billed_team();
ALTER TABLE "event_enrollments" ADD CONSTRAINT "enrollment_fee_scope_valid" CHECK ("feeScopeSnapshot" IN ('PARTICIPANT','TEAM'));
