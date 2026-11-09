-- CreateEnum
CREATE TYPE "RegistrationPaymentMode" AS ENUM ('FREE', 'PAID', 'DISABLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "feeAmountMinor" INTEGER,
ADD COLUMN     "feeApprovedAt" TIMESTAMP(3),
ADD COLUMN     "feeCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "feeScope" TEXT NOT NULL DEFAULT 'PARTICIPANT',
ADD COLUMN     "paymentPolicyUrl" TEXT,
ADD COLUMN     "paymentSettingsVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "receiptIssuer" TEXT,
ADD COLUMN     "refundPolicyUrl" TEXT,
ADD COLUMN     "registrationPaymentMode" "RegistrationPaymentMode" NOT NULL DEFAULT 'DISABLED',
ADD COLUMN     "taxAmountMinor" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "event_enrollments" ADD COLUMN     "codeOfConductAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feeAmountSnapshot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "feeCurrencySnapshot" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "paymentModeSnapshot" "RegistrationPaymentMode" NOT NULL DEFAULT 'DISABLED',
ADD COLUMN     "paymentPolicySnapshot" JSONB,
ADD COLUMN     "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxAmountSnapshot" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "environment" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "taxAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "paymentMode" TEXT NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "creationStartedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "method" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "environment" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "paymentTransactionId" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_notifications" (
    "id" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "payment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "rulesAccepted" BOOLEAN NOT NULL,
    "privacyAccepted" BOOLEAN NOT NULL,
    "codeOfConductAccepted" BOOLEAN NOT NULL,
    "eligibilityConfirmed" BOOLEAN NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_enrollmentId_key" ON "payment_orders"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_providerOrderId_key" ON "payment_orders"("providerOrderId");

-- CreateIndex
CREATE INDEX "payment_orders_userId_createdAt_idx" ON "payment_orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_orders_status_updatedAt_idx" ON "payment_orders"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_providerPaymentId_key" ON "payment_transactions"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentOrderId_status_idx" ON "payment_transactions"("paymentOrderId", "status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_processingStatus_receivedAt_idx" ON "payment_webhook_events"("processingStatus", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_environment_providerEventId_key" ON "payment_webhook_events"("provider", "environment", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_refunds_providerRefundId_key" ON "payment_refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "payment_refunds_status_requestedAt_idx" ON "payment_refunds"("status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_notifications_deduplicationKey_key" ON "payment_notifications"("deduplicationKey");

-- CreateIndex
CREATE INDEX "payment_notifications_status_nextAttemptAt_idx" ON "payment_notifications"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "registration_consents_userId_version_key" ON "registration_consents"("userId", "version");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "event_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_consents" ADD CONSTRAINT "registration_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
