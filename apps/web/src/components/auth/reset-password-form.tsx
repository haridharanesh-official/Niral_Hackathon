"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const schema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setMessage(null);

    const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: values.token,
        password: values.password,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message ?? "Reset failed");
      return;
    }

    setMessage(data.message ?? "Password updated");
    setTimeout(() => router.push("/login"), 1200);
  });

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Paste your reset token and set a strong password."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Reset token</span>
          <textarea className="field-input min-h-24" {...register("token")} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">New password</span>
          <input
            type="password"
            className="field-input"
            {...register("password")}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Confirm password</span>
          <input
            type="password"
            className="field-input"
            {...register("confirmPassword")}
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
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
