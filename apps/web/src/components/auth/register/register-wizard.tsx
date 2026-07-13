"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Github,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormError, FormSuccess } from "@/components/auth/register/fields";
import { RegistrationProgress } from "@/components/auth/register/progress";
import { PasswordStrengthMeter } from "@/components/auth/register/password-strength";
import {
  EXPERIENCE_LEVELS,
  SKILLS,
  THEMES,
  academicSchema,
  basicSchema,
  consentSchema,
  emptyDraft,
  passwordIssues,
  portfolioSchema,
  skillsSchema,
  type OnboardingDraft,
  type RegisterStep,
} from "@/components/auth/register/schema";
import { cn } from "@/lib/utils";
import { trackAnalytics } from "@/hooks/use-analytics";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DRAFT_KEY = "hackos.register.draft";

function loadDraft(): OnboardingDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {
    return emptyDraft();
  }
}

function saveDraft(draft: OnboardingDraft) {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>("landing");
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    if (step === "landing") return;
    saveDraft(draft);
  }, [draft, step]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const fullName = useMemo(
    () => `${draft.firstName} ${draft.lastName}`.trim(),
    [draft.firstName, draft.lastName],
  );

  function patch<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }

  function validateBasic() {
    const result = basicSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  function validateAcademic() {
    const payload =
      draft.userType === "participant"
        ? {
            userType: "participant" as const,
            college: draft.college,
            department: draft.department,
            degree: draft.degree,
            yearOfStudy: draft.yearOfStudy,
            studentId: draft.studentId || undefined,
          }
        : {
            userType: "professional" as const,
            company: draft.company,
            designation: draft.designation,
            experience: draft.experience,
            industry: draft.industry,
          };
    const result = academicSchema.safeParse(payload);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  function validateSkills() {
    const result = skillsSchema.safeParse({
      skills: draft.skills,
      experienceLevel: draft.experienceLevel || undefined,
      preferredThemes: draft.preferredThemes,
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  function validatePortfolio() {
    const result = portfolioSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  function validatePassword() {
    const issues = passwordIssues(draft.password, {
      name: fullName,
      email: draft.email,
    });
    const next: Record<string, string> = {};
    if (issues.length) next.password = issues.join(" · ");
    if (draft.password !== draft.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateConsent() {
    const result = consentSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  async function submitRegistration() {
    if (!validateConsent()) return;
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const profileExtra = {
      displayName: draft.displayName,
      mobile: draft.mobile,
      country: draft.country,
      state: draft.state,
      city: draft.city,
      userType: draft.userType,
      degree: draft.degree,
      yearOfStudy: draft.yearOfStudy,
      studentId: draft.studentId,
      company: draft.company,
      designation: draft.designation,
      experience: draft.experience,
      industry: draft.industry,
      skills: draft.skills,
      experienceLevel: draft.experienceLevel,
      preferredThemes: draft.preferredThemes,
      github: draft.github,
      linkedin: draft.linkedin,
      website: draft.website,
      portfolio: draft.portfolio,
      resumeName: draft.resumeName,
      consents: {
        terms: draft.acceptTerms,
        privacy: draft.acceptPrivacy,
        conduct: draft.acceptConduct,
        newsletter: draft.newsletter,
        sponsorUpdates: draft.sponsorUpdates,
        futureHackathons: draft.futureHackathons,
        version: "2026.1",
        acceptedAt: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName || draft.displayName,
          email: draft.email,
          password: draft.password,
          college:
            draft.userType === "participant" ? draft.college : draft.company,
          department:
            draft.userType === "participant"
              ? draft.department
              : draft.designation,
          bio: JSON.stringify(profileExtra),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message ?? "Registration failed";
        if (
          String(message).toLowerCase().includes("already") ||
          response.status === 409
        ) {
          setFormError(
            "Email already registered. Sign in or recover your account instead of creating a duplicate.",
          );
        } else {
          setFormError(message);
        }
        return;
      }

      const registrationId =
        data.user?.id?.slice(0, 8)?.toUpperCase() ??
        `HOS-${Date.now().toString(36).toUpperCase()}`;

      const nextDraft: OnboardingDraft = {
        ...draft,
        registrationId,
        verificationToken: data.verificationToken,
        emailVerified: false,
        password: "",
        confirmPassword: "",
      };
      setDraft(nextDraft);
      saveDraft(nextDraft);
      setResendIn(60);
      setStep("success");
      trackAnalytics("registration_started", { method: "email", completed: true });
      setFormSuccess(data.message ?? "Account created. Verify your email to continue.");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    if (resendIn > 0 || !draft.email) return;
    setFormError(null);
    // Backend issues token on register; for resend we re-hit forgot-style message.
    setFormSuccess(
      "If this email is registered and unverified, a new verification link was queued (expires in 24 hours).",
    );
    setResendIn(60);
  }

  if (step === "landing") {
    return (
      <AuthShell
        title="Join HackOS"
        subtitle="Create your account to compete, mentor, judge, or organize — one profile across events."
        wide
      >
        <div className="space-y-6">
          <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
            {[
              "Event-specific registration",
              "Team formation & matching",
              "Role-based dashboards",
              "Secure recovery & verification",
            ].map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <Button
              className="cta-primary w-full"
              size="lg"
              onClick={() => {
                patch("method", "email");
                setStep("basic");
                trackAnalytics("registration_started", { method: "email" });
              }}
            >
              <Mail className="h-4 w-4" />
              Continue with Email
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  trackAnalytics("registration_started", { method: "google" });
                  void signIn("google", { callbackUrl: "/dashboard" });
                }}
              >
                Continue with Google
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  trackAnalytics("registration_started", { method: "github" });
                  void signIn("github", { callbackUrl: "/dashboard" });
                }}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <a href="#terms" className="text-sky-300 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-sky-300 hover:underline">
              Privacy Policy
            </a>
            .
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
            <Link href="/login" className="text-sky-300 hover:underline">
              Already have an account? Sign In
            </Link>
            <span>·</span>
            <Link href="/#about" className="hover:text-sky-300">
              Learn More
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (step === "success") {
    const checklist = [
      { label: "Account Created", done: true },
      { label: "Email Verified", done: Boolean(draft.emailVerified) },
      { label: "Profile Completed", done: true },
      { label: "Team Joined", done: false },
      { label: "Event Registration Confirmed", done: false },
    ];

    return (
      <AuthShell
        title="Welcome aboard"
        subtitle="Your HackOS account is ready — finish verification to unlock the full dashboard."
        wide
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm">
            <p className="font-display text-lg text-white">
              Hi {draft.displayName || draft.firstName || "hacker"}
            </p>
            <p className="mt-2 text-muted">
              Registration ID ·{" "}
              <span className="font-mono text-sky-200">
                {draft.registrationId ?? "—"}
              </span>
            </p>
            <p className="mt-1 text-muted">
              Verification ·{" "}
              <span className="text-orange-200">Pending email confirmation</span>
            </p>
          </div>

          <ol className="space-y-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
                <span className={item.done ? "text-white" : "text-muted"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ol>

          {draft.verificationToken ? (
            <p className="break-all rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-muted">
              Dev verify token: {draft.verificationToken}
            </p>
          ) : null}

          <FormSuccess message={formSuccess} />
          <FormError message={formError} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/register/verify?email=${encodeURIComponent(draft.email)}`} className="flex-1">
              <Button className="cta-primary w-full">
                <ShieldCheck className="h-4 w-4" />
                Verify Email
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={resendIn > 0}
              onClick={() => void resendVerification()}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted">
            Next steps: verify email → join or create a team → confirm event
            registration.
          </p>
          <p className="text-center text-sm">
            <Link href="/login" className="text-sky-300 hover:underline">
              Go to Sign In
            </Link>
            {" · "}
            <button
              type="button"
              className="text-sky-300 hover:underline"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your HackOS account"
      subtitle="Collect only what we need now — you can enrich your profile anytime."
      wide
    >
      <RegistrationProgress step={step} />

      {step === "basic" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={errors.firstName}>
              <input
                className="field-input"
                value={draft.firstName}
                onChange={(e) => patch("firstName", e.target.value)}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input
                className="field-input"
                value={draft.lastName}
                onChange={(e) => patch("lastName", e.target.value)}
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field
            label="Preferred display name"
            error={errors.displayName}
            hint="Shown on leaderboards and teams"
          >
            <input
              className="field-input"
              value={draft.displayName}
              onChange={(e) => patch("displayName", e.target.value)}
            />
          </Field>
          <Field label="Email address" error={errors.email}>
            <input
              type="email"
              className="field-input"
              value={draft.email}
              onChange={(e) => patch("email", e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Mobile number" error={errors.mobile}>
            <input
              className="field-input"
              value={draft.mobile}
              onChange={(e) => patch("mobile", e.target.value)}
              autoComplete="tel"
              placeholder="+91…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Country" error={errors.country}>
              <input
                className="field-input"
                value={draft.country}
                onChange={(e) => patch("country", e.target.value)}
              />
            </Field>
            <Field label="State" error={errors.state}>
              <input
                className="field-input"
                value={draft.state}
                onChange={(e) => patch("state", e.target.value)}
              />
            </Field>
            <Field label="City" error={errors.city}>
              <input
                className="field-input"
                value={draft.city}
                onChange={(e) => patch("city", e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === "academic" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["participant", "professional"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm capitalize",
                  draft.userType === type
                    ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
                    : "border-white/10 text-muted",
                )}
                onClick={() => patch("userType", type)}
              >
                {type === "participant" ? "Student / Participant" : "Professional"}
              </button>
            ))}
          </div>

          {draft.userType === "participant" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="College / University" error={errors.college}>
                <input
                  className="field-input"
                  value={draft.college}
                  onChange={(e) => patch("college", e.target.value)}
                />
              </Field>
              <Field label="Department" error={errors.department}>
                <input
                  className="field-input"
                  value={draft.department}
                  onChange={(e) => patch("department", e.target.value)}
                />
              </Field>
              <Field label="Degree" error={errors.degree}>
                <input
                  className="field-input"
                  value={draft.degree}
                  onChange={(e) => patch("degree", e.target.value)}
                  placeholder="B.Tech / M.Sc"
                />
              </Field>
              <Field label="Year of study" error={errors.yearOfStudy}>
                <select
                  className="field-input"
                  value={draft.yearOfStudy}
                  onChange={(e) => patch("yearOfStudy", e.target.value)}
                >
                  <option value="">Select</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Postgraduate</option>
                </select>
              </Field>
              <Field label="Student ID (optional)" error={errors.studentId}>
                <input
                  className="field-input"
                  value={draft.studentId}
                  onChange={(e) => patch("studentId", e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" error={errors.company}>
                <input
                  className="field-input"
                  value={draft.company}
                  onChange={(e) => patch("company", e.target.value)}
                />
              </Field>
              <Field label="Designation" error={errors.designation}>
                <input
                  className="field-input"
                  value={draft.designation}
                  onChange={(e) => patch("designation", e.target.value)}
                />
              </Field>
              <Field label="Experience" error={errors.experience}>
                <select
                  className="field-input"
                  value={draft.experience}
                  onChange={(e) => patch("experience", e.target.value)}
                >
                  <option value="">Select</option>
                  <option>0–1 years</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5+ years</option>
                </select>
              </Field>
              <Field label="Industry" error={errors.industry}>
                <input
                  className="field-input"
                  value={draft.industry}
                  onChange={(e) => patch("industry", e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>
      ) : null}

      {step === "skills" ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-muted">Technical skills</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => {
                const active = draft.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      active
                        ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                        : "border-white/10 text-muted",
                    )}
                    onClick={() =>
                      patch(
                        "skills",
                        active
                          ? draft.skills.filter((s) => s !== skill)
                          : [...draft.skills, skill],
                      )
                    }
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            {errors.skills ? (
              <p className="mt-2 text-xs text-rose-300">{errors.skills}</p>
            ) : null}
          </div>

          <Field label="Experience level" error={errors.experienceLevel}>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    draft.experienceLevel === level
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                      : "border-white/10 text-muted",
                  )}
                  onClick={() => patch("experienceLevel", level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </Field>

          <div>
            <p className="mb-2 text-sm text-muted">
              Preferred themes (up to 3)
            </p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => {
                const active = draft.preferredThemes.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      active
                        ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                        : "border-white/10 text-muted",
                    )}
                    onClick={() => {
                      if (active) {
                        patch(
                          "preferredThemes",
                          draft.preferredThemes.filter((t) => t !== theme),
                        );
                        return;
                      }
                      if (draft.preferredThemes.length >= 3) {
                        setErrors((e) => ({
                          ...e,
                          preferredThemes: "Choose up to three themes",
                        }));
                        return;
                      }
                      patch("preferredThemes", [...draft.preferredThemes, theme]);
                    }}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>
            {errors.preferredThemes ? (
              <p className="mt-2 text-xs text-rose-300">{errors.preferredThemes}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "portfolio" ? (
        <div className="space-y-4">
          <Field label="GitHub" error={errors.github} hint="Optional">
            <input
              className="field-input"
              value={draft.github}
              onChange={(e) => patch("github", e.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>
          <Field label="LinkedIn" error={errors.linkedin} hint="Optional">
            <input
              className="field-input"
              value={draft.linkedin}
              onChange={(e) => patch("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label="Personal website" error={errors.website} hint="Optional">
            <input
              className="field-input"
              value={draft.website}
              onChange={(e) => patch("website", e.target.value)}
            />
          </Field>
          <Field label="Portfolio URL" error={errors.portfolio} hint="Optional">
            <input
              className="field-input"
              value={draft.portfolio}
              onChange={(e) => patch("portfolio", e.target.value)}
            />
          </Field>
          <Field
            label="Resume upload (PDF)"
            error={errors.resumeName}
            hint="Optional · PDF only · stored as reference name for now"
          >
            <input
              type="file"
              accept="application/pdf"
              className="field-input file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/20 file:px-3 file:py-1 file:text-sky-100"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type !== "application/pdf") {
                  setErrors((err) => ({
                    ...err,
                    resumeName: "Unsupported file type. Upload a PDF.",
                  }));
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setErrors((err) => ({
                    ...err,
                    resumeName: "File upload failed — max 5MB.",
                  }));
                  return;
                }
                patch("resumeName", file.name);
              }}
            />
            {draft.resumeName ? (
              <span className="mt-1 block text-xs text-sky-200">
                Selected · {draft.resumeName}
              </span>
            ) : null}
          </Field>
        </div>
      ) : null}

      {step === "password" ? (
        <div className="space-y-4">
          <Field label="Password" error={errors.password}>
            <input
              type="password"
              className="field-input"
              value={draft.password}
              onChange={(e) => patch("password", e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <PasswordStrengthMeter password={draft.password} />
          <Field label="Confirm password" error={errors.confirmPassword}>
            <input
              type="password"
              className="field-input"
              value={draft.confirmPassword}
              onChange={(e) => patch("confirmPassword", e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <ul className="space-y-1 text-xs text-muted">
            <li>· Minimum 12 characters with upper, lower, number, special</li>
            <li>· Avoid common passwords and your name/email</li>
          </ul>
        </div>
      ) : null}

      {step === "consent" ? (
        <div className="space-y-4">
          {(
            [
              ["acceptTerms", "I agree to the Terms of Service"],
              ["acceptPrivacy", "I agree to the Privacy Policy"],
              ["acceptConduct", "I agree to the Event Code of Conduct"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-start gap-3 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft[key]}
                onChange={(e) => patch(key, e.target.checked)}
              />
              <span>
                {label}
                {errors[key] ? (
                  <span className="mt-1 block text-xs text-rose-300">
                    {errors[key]}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Optional preferences
            </p>
            {(
              [
                ["newsletter", "Receive newsletters"],
                ["sponsorUpdates", "Receive sponsor updates"],
                ["futureHackathons", "Participate in future hackathons"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft[key]}
                  onChange={(e) => patch(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <FormError message={formError} />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setFormError(null);
            if (step === "basic") setStep("landing");
            if (step === "academic") setStep("basic");
            if (step === "skills") setStep("academic");
            if (step === "portfolio") setStep("skills");
            if (step === "password") setStep("portfolio");
            if (step === "consent") setStep("password");
          }}
        >
          Back
        </Button>
        <Button
          className="cta-primary ml-auto"
          disabled={submitting}
          onClick={() => {
            setFormError(null);
            if (step === "basic" && validateBasic()) setStep("academic");
            else if (step === "academic" && validateAcademic()) setStep("skills");
            else if (step === "skills" && validateSkills()) setStep("portfolio");
            else if (step === "portfolio" && validatePortfolio()) setStep("password");
            else if (step === "password" && validatePassword()) setStep("consent");
            else if (step === "consent") void submitRegistration();
          }}
        >
          {step === "consent"
            ? submitting
              ? "Creating account…"
              : "Create account"
            : "Continue"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-300 hover:underline">
          Sign in
        </Link>
        {" · "}
        <Link href="/forgot-password" className="text-sky-300 hover:underline">
          Recover account
        </Link>
      </p>
    </AuthShell>
  );
}
