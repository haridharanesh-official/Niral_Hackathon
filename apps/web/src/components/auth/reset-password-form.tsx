"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginNav } from "@/components/auth/login/login-nav";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const schema = z
  .object({
    token: z.string().min(10, "Reset link is invalid or incomplete"),
    password: z
      .string()
      .min(12, "Use at least 12 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(12),
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
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
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
      setError(
        typeof data.message === "string"
          ? data.message
          : "This reset link is invalid or has expired.",
      );
      return;
    }

    setMessage("Password updated. You can sign in with your new password.");
    setTimeout(() => router.push("/login"), 1400);
  });

  const hasToken = Boolean(searchParams.get("token"));

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <LoginNav />
      <div className="relative z-10 mx-auto max-w-md px-6 py-12">
        <div className="glass glow-ring rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-white">
            Create new password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose a strong password. This link works once and is invalidated
            after you save.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {!hasToken ? (
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Reset token</span>
                <textarea
                  className="field-input min-h-24 font-mono text-xs"
                  {...register("token")}
                />
                {errors.token ? (
                  <span className="text-xs text-rose-300">
                    {errors.token.message}
                  </span>
                ) : null}
              </label>
            ) : (
              <input type="hidden" {...register("token")} />
            )}

            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">New password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="field-input pr-12"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-sky-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <span className="text-xs text-rose-300">
                  {errors.password.message}
                </span>
              ) : (
                <span className="text-xs text-muted">Minimum 12 characters</span>
              )}
            </label>

            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">Confirm password</span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="field-input"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <span className="text-xs text-rose-300">
                  {errors.confirmPassword.message}
                </span>
              ) : null}
            </label>

            {error ? (
              <p
                className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {message ? (
              <p
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
                role="status"
              >
                {message}
              </p>
            ) : null}

            <Button type="submit" className="cta-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>

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
