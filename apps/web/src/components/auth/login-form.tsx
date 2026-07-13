"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error === "2FA_REQUIRED" || result?.error?.includes("2FA")) {
      setNeeds2FA(true);
      setError("Enter your authenticator code to continue.");
      return;
    }

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to HackOS and continue building."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            className="field-input"
            {...register("email")}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            className="field-input"
            {...register("password")}
          />
        </Field>
        {needs2FA ? (
          <Field label="Authenticator code">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field-input"
              {...register("totpCode")}
            />
          </Field>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
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
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          <Mail className="h-4 w-4" />
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          <Github className="h-4 w-4" />
          GitHub
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
        <Link href="/forgot-password" className="text-sky-300 hover:underline">
          Forgot password
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
