"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormError, FormSuccess } from "@/components/auth/register/fields";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DRAFT_KEY = "hackos.register.draft";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const tokenFromQuery = params.get("token") ?? "";
  const [token, setToken] = useState(tokenFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  async function verify() {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.message?.includes("token") || response.status === 400
            ? "Invalid or expired verification link. Request a new one — links expire after 24 hours."
            : (data.message ?? "Verification failed"),
        );
        return;
      }
      setSuccess(data.message ?? "Email verified successfully.");
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ ...draft, emailVerified: true }),
          );
        }
      } catch {
        /* ignore */
      }
      setTimeout(() => router.push("/login"), 1400);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        email
          ? `We sent a verification link to ${email}. Paste the token or open the link from your inbox.`
          : "Paste your verification token to activate full access."
      }
    >
      <div className="space-y-4">
        <Field label="Verification token">
          <input
            className="field-input font-mono text-sm"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from email / API response"
          />
        </Field>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button
          className="cta-primary w-full"
          disabled={pending || !token.trim()}
          onClick={() => void verify()}
        >
          {pending ? "Verifying…" : "Verify email"}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={resendIn > 0}
          onClick={() => {
            setSuccess(
              "If this email is registered and unverified, a new link was queued (60s cooldown).",
            );
            setResendIn(60);
          }}
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification email"}
        </Button>
        <p className="text-center text-sm text-muted">
          Already verified?{" "}
          <Link href="/login" className="text-sky-300 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Verify your email" subtitle="Loading…">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </AuthShell>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
