-- Additive integrity checks. Existing enrollments retain their historical state;
-- no fee is inferred, no payment is backfilled, and no registration is deleted.
ALTER TABLE "events" ADD CONSTRAINT "event_fee_minor_units_valid"
  CHECK (COALESCE("feeAmountMinor", 0) >= 0 AND "taxAmountMinor" >= 0 AND COALESCE("feeAmountMinor", 0)::bigint + "taxAmountMinor"::bigint <= 100000000);
ALTER TABLE "events" ADD CONSTRAINT "event_fee_scope_valid" CHECK ("feeScope" IN ('PARTICIPANT', 'TEAM'));
ALTER TABLE "events" ADD CONSTRAINT "event_paid_terms_required"
  CHECK ("registrationPaymentMode" <> 'PAID' OR ("feeAmountMinor" >= 100 AND "feeApprovedAt" IS NOT NULL AND "feeCurrency" = 'INR' AND "receiptIssuer" IS NOT NULL AND "paymentPolicyUrl" IS NOT NULL AND "refundPolicyUrl" IS NOT NULL));
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_order_amount_valid"
  CHECK ("amountMinor" >= 100 AND "amountMinor" <= 100000000 AND "taxAmountMinor" >= 0 AND "taxAmountMinor" <= "amountMinor" AND "currency" = 'INR');
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_order_environment_valid" CHECK ("environment" IN ('test', 'live') AND "provider" = 'RAZORPAY');
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transaction_amount_valid" CHECK ("amountMinor" > 0 AND "amountMinor" <= 100000000 AND "currency" = 'INR');
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refund_amount_valid" CHECK ("amountMinor" > 0 AND "amountMinor" <= 100000000);
ALTER TABLE "registration_consents" ADD CONSTRAINT "registration_consents_required" CHECK ("rulesAccepted" AND "privacyAccepted" AND "codeOfConductAccepted" AND "eligibilityConfirmed");
