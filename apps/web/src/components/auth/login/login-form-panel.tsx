"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Github, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearLoginFailures,
  dashboardPathForRole,
  getLoginFailureState,
  recordLoginFailure,
  REMEMBER_KEY,
  THEME_KEY,
  LANG_KEY,
} from "@/components/auth/login/login-utils";
import { recordLoginSession } from "@/components/auth/login/session-tracker";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginFormPanel() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [delayMs, setDelayMs] = useState(0);
  const hideTimer = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      totpCode: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY) === "1";
    if (remembered) setValue("rememberMe", true);

    const fail = getLoginFailureState();
    if (fail.lockedUntil > Date.now()) {
      const mins = Math.ceil((fail.lockedUntil - Date.now()) / 60_000);
      setLockMessage(
        `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
      );
    }
  }, [setValue]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function togglePasswordVisible() {
    setShowPassword((v) => {
      const next = !v;
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (next) {
        hideTimer.current = window.setTimeout(() => setShowPassword(false), 12_000);
      }
      return next;
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    const fail = getLoginFailureState();
    if (fail.lockedUntil > Date.now()) {
      const mins = Math.ceil((fail.lockedUntil - Date.now()) / 60_000);
      setLockMessage(
        `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
      );
      return;
    }

    if (values.rememberMe) {
      localStorage.setItem(REMEMBER_KEY, "1");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    if (delayMs > 0) {
      await new Promise((r) => window.setTimeout(r, delayMs));
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      totpCode: values.totpCode || undefined,
      redirect: false,
    });

    if (result?.error === "2FA_REQUIRED" || result?.error?.includes("2FA")) {
      setNeeds2FA(true);
      setError("Enter your authenticator code to continue.");
      return;
    }

    if (result?.error) {
      const recorded = recordLoginFailure();
      setDelayMs(recorded.delayMs);
      if (recorded.lockedUntil > Date.now()) {
        setLockMessage(
          "Account temporarily locked after repeated failed attempts. Check your email for a security notice, or try again later.",
        );
      }
      setError("Invalid email or password.");
      return;
    }

    clearLoginFailures();
    setDelayMs(0);
    setLockMessage(null);
    recordLoginSession();

    const session = await getSession();
    const role = session?.user?.role;
    const dest = dashboardPathForRole(role);

    // Persist prefs on successful remember-me login
    if (values.rememberMe) {
      if (!localStorage.getItem(THEME_KEY)) {
        localStorage.setItem(THEME_KEY, "dark");
      }
      if (!localStorage.getItem(LANG_KEY)) {
        localStorage.setItem(LANG_KEY, "EN");
      }
    }

    router.push(dest);
    router.refresh();
  });

  const emailReg = register("email");
  const passwordReg = register("password");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
        Welcome Back
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to continue to your HackOS workspace.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Email address</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            className="field-input"
            maxLength={254}
            {...emailReg}
            onChange={(e) => {
              e.target.value = e.target.value.trimStart();
              void emailReg.onChange(e);
            }}
            onBlur={(e) => {
              e.target.value = e.target.value.trim().toLowerCase();
              void emailReg.onBlur(e);
              setValue("email", e.target.value, { shouldValidate: true });
            }}
          />
          {errors.email ? (
            <span className="text-xs text-rose-300">{errors.email.message}</span>
          ) : null}
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="field-input pr-12"
              {...passwordReg}
              onKeyUp={(e) =>
                setCapsLock(e.getModifierState?.("CapsLock") ?? false)
              }
              onKeyDown={(e) =>
                setCapsLock(e.getModifierState?.("CapsLock") ?? false)
              }
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-sky-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={togglePasswordVisible}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {capsLock ? (
            <span className="text-xs text-orange-300">Caps Lock is on</span>
          ) : null}
          {errors.password ? (
            <span className="text-xs text-rose-300">{errors.password.message}</span>
          ) : null}
        </label>

        {needs2FA ? (
          <label className="block space-y-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Shield className="h-3.5 w-3.5 text-sky-300" />
              Authenticator code
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field-input"
              placeholder="6-digit code"
              {...register("totpCode")}
            />
            <span className="text-xs text-muted">
              Open your authenticator app, or use a backup code if available.
            </span>
          </label>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-muted">
            <input type="checkbox" {...register("rememberMe")} />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sky-300 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {rememberMe ? (
          <p className="text-xs text-muted">
            Extends session refresh preference and keeps language/theme. Passwords
            are never stored on this device.
          </p>
        ) : null}

        {lockMessage ? (
          <p
            className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-100"
            role="alert"
          >
            {lockMessage}
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
            role="alert"
          >
            {error}
            {delayMs > 0 && !lockMessage ? (
              <span className="mt-1 block text-xs text-rose-200/80">
                Security delay applied after repeated failures.
              </span>
            ) : null}
          </p>
        ) : null}

        <Button
          type="submit"
          className="cta-primary w-full"
          disabled={isSubmitting || Boolean(lockMessage)}
        >
          {isSubmitting ? "Signing in…" : "Login"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-white/10" />
        or continue with
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full opacity-60 cursor-not-allowed"
          disabled
          title="Google OAuth integration will be activated when client credentials are provided"
        >
          <Mail className="h-4 w-4" />
          Google <span className="text-[10px] text-muted ml-1">(Coming Soon)</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full opacity-60 cursor-not-allowed"
          disabled
          title="GitHub OAuth integration will be activated when client credentials are provided"
        >
          <Github className="h-4 w-4" />
          GitHub <span className="text-[10px] text-muted ml-1">(Coming Soon)</span>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-sky-300 hover:underline">
          Register
        </Link>
        {" · "}
        <Link href="/register/verify" className="text-sky-300 hover:underline">
          Verify email
        </Link>
        {" · "}
        <Link href="/account-recovery" className="text-sky-300 hover:underline">
          Can&apos;t access email?
        </Link>
      </p>
    </div>
  );
}
