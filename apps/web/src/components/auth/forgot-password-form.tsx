"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoginNav } from "@/components/auth/login/login-nav";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .transform((v) => v.toLowerCase()),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "sent">("form");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);

    const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email }),
    });

    const data = await response.json().catch(() => ({}));
    setMessage(
      data.message ??
        "If that email exists, a reset link was sent. Check your inbox.",
    );
    setStep("sent");
  });

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <LoginNav />
      <div className="relative z-10 mx-auto max-w-md px-6 py-12">
        <div className="glass glow-ring rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-white">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter your account email. We&apos;ll send a single-use reset link
            that expires in 60 minutes.
          </p>

          {step === "form" ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  className="field-input"
                  {...register("email")}
                />
                {errors.email ? (
                  <span className="text-xs text-rose-300">
                    {errors.email.message}
                  </span>
                ) : null}
              </label>

              <Button type="submit" className="cta-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <p
                className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100"
                role="status"
              >
                {message}
              </p>
              <p className="text-sm text-muted">
                Didn&apos;t get an email? Check spam, wait a minute, or{" "}
                <Link href="/account-recovery" className="text-sky-300 hover:underline">
                  contact support
                </Link>
                .
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setStep("form")}
              >
                Try another email
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/login" className="text-sky-300 hover:underline">
              Return to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
