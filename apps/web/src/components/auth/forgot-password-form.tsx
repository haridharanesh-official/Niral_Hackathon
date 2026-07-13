"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setToken(null);

    const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));
    setMessage(data.message ?? "If that email exists, a reset link was sent.");
    if (data.resetToken) setToken(data.resetToken);
  });

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll generate a secure reset token for your account."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input type="email" className="field-input" {...register("email")} />
        </label>

        {message ? (
          <p className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
            {message}
          </p>
        ) : null}

        {token ? (
          <p className="break-all rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
            Dev reset token: {token}
            <br />
            <Link
              href={`/reset-password?token=${encodeURIComponent(token)}`}
              className="text-sky-300 underline"
            >
              Continue to reset form
            </Link>
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-sky-300 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
