"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoginNav } from "@/components/auth/login/login-nav";

const schema = z.object({
  fullName: z.string().min(2, "Name is required").max(80),
  registeredEmail: z.string().email("Enter the email on your account"),
  alternateContact: z.string().min(5, "Provide a phone or alternate email"),
  reason: z.string().min(20, "Please describe the issue (20+ characters)").max(1000),
});

type FormValues = z.infer<typeof schema>;

const RECOVERY_LOG_KEY = "hackos.recovery.attempts";

export function AccountRecoveryForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const entry = {
      ...values,
      at: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    try {
      const prev = JSON.parse(localStorage.getItem(RECOVERY_LOG_KEY) ?? "[]") as unknown[];
      localStorage.setItem(
        RECOVERY_LOG_KEY,
        JSON.stringify([entry, ...prev].slice(0, 20)),
      );
    } catch {
      /* ignore */
    }
    // Simulated support ticket — org verifies identity offline
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  });

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <LoginNav />
      <div className="relative z-10 mx-auto max-w-lg px-6 py-12">
        <div className="glass glow-ring rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-white">
            Account recovery
          </h1>
          <p className="mt-2 text-sm text-muted">
            Can&apos;t access your email? Submit a recovery request. Organizers
            will verify your identity using alternate methods and contact you.
            All attempts are logged for audit.
          </p>

          {submitted ? (
            <div className="mt-6 space-y-4">
              <p
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                role="status"
              >
                Recovery request received. Support will respond within 1–2
                business days. Keep your alternate contact reachable.
              </p>
              <Link href="/login" className="text-sm text-sky-300 hover:underline">
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Full name</span>
                <input className="field-input" {...register("fullName")} />
                {errors.fullName ? (
                  <span className="text-xs text-rose-300">
                    {errors.fullName.message}
                  </span>
                ) : null}
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Registered email (inaccessible)</span>
                <input
                  type="email"
                  className="field-input"
                  {...register("registeredEmail")}
                />
                {errors.registeredEmail ? (
                  <span className="text-xs text-rose-300">
                    {errors.registeredEmail.message}
                  </span>
                ) : null}
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Alternate phone or email</span>
                <input className="field-input" {...register("alternateContact")} />
                {errors.alternateContact ? (
                  <span className="text-xs text-rose-300">
                    {errors.alternateContact.message}
                  </span>
                ) : null}
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">What happened?</span>
                <textarea
                  className="field-input min-h-28"
                  {...register("reason")}
                />
                {errors.reason ? (
                  <span className="text-xs text-rose-300">
                    {errors.reason.message}
                  </span>
                ) : null}
              </label>
              <Button type="submit" className="cta-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit recovery request"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Still have email access?{" "}
            <Link href="/forgot-password" className="text-sky-300 hover:underline">
              Reset password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
