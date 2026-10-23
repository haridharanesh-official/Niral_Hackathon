"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserProfileData } from "@hackos/shared";
import { Button } from "@/components/ui/button";
import {
  DRAFT_KEY,
  INTEREST_DOMAINS,
  PROFILE_STEP_LABELS,
  PROFILE_STEPS,
  ProfileDraft,
  emptyProfileDraft,
  profileToDraft,
  draftToProfile,
  validateStep,
  SKILL_CATALOG,
  SKILL_LEVELS,
} from "@/components/onboarding/profile-schema";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ProfileCompletionWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const step = PROFILE_STEPS[stepIndex];
  const percent = useMemo(
    () => Math.round(((stepIndex + 1) / PROFILE_STEPS.length) * 100),
    [stepIndex],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        setDraft({ ...emptyProfileDraft(), ...JSON.parse(raw) });
        return;
      }
    } catch {
      /* ignore */
    }

    if (!session?.accessToken) return;
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((user) => {
        setDraft(
          profileToDraft(user.profile as UserProfileData | null, user.name ?? ""),
        );
      })
      .catch(() => undefined);
  }, [session?.accessToken]);

  function patch(partial: Partial<ProfileDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function save(markComplete = false) {
    if (!session?.accessToken) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const profile = draftToProfile(draft);
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: draft.name,
        image: draft.photoDataUrl || undefined,
        college: draft.institution || draft.company || draft.organization || undefined,
        department: draft.department || draft.industry || draft.researchDomain || undefined,
        bio: draft.bio || undefined,
        profile,
        markComplete,
      }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Could not save profile");
      return;
    }

    if (markComplete) {
      sessionStorage.removeItem(DRAFT_KEY);
      setMessage("Profile completed. Continue to event enrollment.");
      router.push("/dashboard/enrollment");
      router.refresh();
      return;
    }

    setMessage("Progress saved. You can continue later.");
  }

  function next() {
    setError(null);
    const result = validateStep(step, draft);
    if (!result.success) {
      const msg =
        "error" in result && result.error?.issues?.[0]?.message
          ? result.error.issues[0].message
          : "Please complete required fields";
      setError(msg);
      return;
    }
    if (stepIndex < PROFILE_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    void save(true);
  }

  async function onPhotoChange(file: File | null) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use JPG, PNG, or WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB");
      return;
    }
    const dataUrl = await stripExifAndSquare(file);
    patch({ photoDataUrl: dataUrl });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Profile Completion
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Become event-ready
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Complete essential details first. Optional portfolio fields can wait —
          progress saves automatically.
        </p>
      </div>

      <div
        className="glass rounded-3xl p-5"
        role="group"
        aria-labelledby="profile-progress-label"
      >
        <div className="flex items-center justify-between gap-3 text-sm">
          <span id="profile-progress-label" className="text-white">
            {PROFILE_STEP_LABELS[step]}
          </span>
          <span className="font-mono text-sky-300" aria-live="polite">
            {percent}% Complete
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Profile completion"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol className="mt-4 flex flex-wrap gap-2">
          {PROFILE_STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${
                  i === stepIndex
                    ? "bg-sky-500/20 text-sky-200"
                    : i < stepIndex
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-white/5 text-muted"
                }`}
                onClick={() => setStepIndex(i)}
              >
                {i + 1}. {PROFILE_STEP_LABELS[s]}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8">
        {step === "personal" ? (
          <PersonalStep draft={draft} patch={patch} onPhotoChange={onPhotoChange} />
        ) : null}
        {step === "background" ? (
          <BackgroundStep draft={draft} patch={patch} />
        ) : null}
        {step === "skills" ? <SkillsStep draft={draft} patch={patch} /> : null}
        {step === "interests" ? (
          <InterestsStep draft={draft} patch={patch} />
        ) : null}
        {step === "portfolio" ? (
          <PortfolioStep draft={draft} patch={patch} />
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100" role="status">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void save(false)}>
            {saving ? "Saving…" : "Save & continue later"}
          </Button>
          <Button type="button" className="cta-primary" disabled={saving} onClick={next}>
            {stepIndex === PROFILE_STEPS.length - 1
              ? saving
                ? "Finishing…"
                : "Complete profile"
              : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PersonalStep({
  draft,
  patch,
  onPhotoChange,
}: {
  draft: ProfileDraft;
  patch: (p: Partial<ProfileDraft>) => void;
  onPhotoChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-white">Personal details</h2>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Display name</span>
        <input
          className="field-input"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          required
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Profile photo (JPG / PNG / WebP, max 5 MB)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/20 file:px-3 file:py-2 file:text-sky-100"
          onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {draft.photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draft.photoDataUrl}
          alt="Profile preview"
          className="h-24 w-24 rounded-2xl object-cover"
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Date of birth (optional)</span>
          <input
            type="date"
            className="field-input"
            value={draft.dateOfBirth}
            onChange={(e) => patch({ dateOfBirth: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Gender (optional)</span>
          <input
            className="field-input"
            value={draft.gender}
            onChange={(e) => patch({ gender: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Preferred pronouns (optional)</span>
          <input
            className="field-input"
            value={draft.pronouns}
            onChange={(e) => patch({ pronouns: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Nationality</span>
          <input
            className="field-input"
            value={draft.nationality}
            onChange={(e) => patch({ nationality: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Preferred language</span>
          <select
            className="field-input"
            value={draft.language}
            onChange={(e) => patch({ language: e.target.value })}
          >
            <option value="EN">English</option>
            <option value="HI">Hindi</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Time zone</span>
          <input
            className="field-input"
            value={draft.timezone}
            onChange={(e) => patch({ timezone: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function BackgroundStep({
  draft,
  patch,
}: {
  draft: ProfileDraft;
  patch: (p: Partial<ProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-white">
        Academic / professional
      </h2>
      <div className="flex flex-wrap gap-2">
        {(["student", "professional", "researcher"] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${
              draft.participantType === type
                ? "bg-sky-500/20 text-sky-200"
                : "bg-white/5 text-muted"
            }`}
            onClick={() => patch({ participantType: type })}
          >
            {type}
          </button>
        ))}
      </div>

      {draft.participantType === "student" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Institution" value={draft.institution} onChange={(v) => patch({ institution: v })} />
          <Field label="Department" value={draft.department} onChange={(v) => patch({ department: v })} />
          <Field label="Degree" value={draft.degree} onChange={(v) => patch({ degree: v })} />
          <Field label="Semester / Year" value={draft.year} onChange={(v) => patch({ year: v })} />
          <Field label="Student ID (optional)" value={draft.studentId} onChange={(v) => patch({ studentId: v })} />
        </div>
      ) : null}

      {draft.participantType === "professional" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" value={draft.company} onChange={(v) => patch({ company: v })} />
          <Field label="Role" value={draft.role} onChange={(v) => patch({ role: v })} />
          <Field label="Years of experience" value={draft.yearsExperience} onChange={(v) => patch({ yearsExperience: v })} />
          <Field label="Industry" value={draft.industry} onChange={(v) => patch({ industry: v })} />
        </div>
      ) : null}

      {draft.participantType === "researcher" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization" value={draft.organization} onChange={(v) => patch({ organization: v })} />
          <Field label="Research domain" value={draft.researchDomain} onChange={(v) => patch({ researchDomain: v })} />
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="text-muted">Publications (optional)</span>
            <textarea
              className="field-input min-h-24"
              value={draft.publications}
              onChange={(e) => patch({ publications: e.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function SkillsStep({
  draft,
  patch,
}: {
  draft: ProfileDraft;
  patch: (p: Partial<ProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-white">Technical skills</h2>
      <p className="text-sm text-muted">Select proficiency for each skill you use.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-3">Skill</th>
              {SKILL_LEVELS.map((level) => (
                <th key={level} className="px-1 py-2 text-center font-normal">
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SKILL_CATALOG.map((skill) => (
              <tr key={skill} className="border-t border-white/5">
                <td className="py-2.5 pr-3 text-white">{skill}</td>
                {SKILL_LEVELS.map((level) => (
                  <td key={level} className="px-1 text-center">
                    <input
                      type="radio"
                      name={`skill-${skill}`}
                      aria-label={`${skill} ${level}`}
                      checked={draft.skills[skill] === level}
                      onChange={() =>
                        patch({
                          skills: { ...draft.skills, [skill]: level },
                        })
                      }
                      className="h-4 w-4 accent-sky-400"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="field-input max-w-xs"
          placeholder="Add custom skill"
          value={draft.customSkill}
          onChange={(e) => patch({ customSkill: e.target.value })}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const value = draft.customSkill.trim();
            if (!value) return;
            if (draft.customSkills.includes(value)) return;
            patch({
              customSkills: [...draft.customSkills, value],
              customSkill: "",
            });
          }}
        >
          Add skill
        </Button>
      </div>
      {draft.customSkills.length ? (
        <ul className="flex flex-wrap gap-2">
          {draft.customSkills.map((s) => (
            <li
              key={s}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-100"
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function InterestsStep({
  draft,
  patch,
}: {
  draft: ProfileDraft;
  patch: (p: Partial<ProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-white">Interests</h2>
      <p className="text-sm text-muted">
        Used for team recommendations and track matching.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {INTEREST_DOMAINS.map((domain) => {
          const selected = draft.interests.includes(domain);
          return (
            <button
              key={domain}
              type="button"
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-white/[0.03] text-muted hover:text-white"
              }`}
              onClick={() =>
                patch({
                  interests: selected
                    ? draft.interests.filter((d) => d !== domain)
                    : [...draft.interests, domain],
                })
              }
            >
              {domain}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PortfolioStep({
  draft,
  patch,
}: {
  draft: ProfileDraft;
  patch: (p: Partial<ProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-white">Portfolio</h2>
      <p className="text-sm text-muted">Optional — improves networking and mentor matching.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GitHub" value={draft.github} onChange={(v) => patch({ github: v })} />
        <Field label="LinkedIn" value={draft.linkedin} onChange={(v) => patch({ linkedin: v })} />
        <Field label="Portfolio website" value={draft.website} onChange={(v) => patch({ website: v })} />
        <Field label="Kaggle" value={draft.kaggle} onChange={(v) => patch({ kaggle: v })} />
        <Field label="Devpost" value={draft.devpost} onChange={(v) => patch({ devpost: v })} />
        <Field label="ResearchGate" value={draft.researchgate} onChange={(v) => patch({ researchgate: v })} />
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Resume file name (upload stub)</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:text-violet-100"
          onChange={(e) =>
            patch({ resumeName: e.target.files?.[0]?.name ?? "" })
          }
        />
        {draft.resumeName ? (
          <span className="text-xs text-sky-300">{draft.resumeName}</span>
        ) : null}
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Personal bio</span>
        <textarea
          className="field-input min-h-28"
          maxLength={500}
          value={draft.bio}
          onChange={(e) => patch({ bio: e.target.value })}
        />
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

async function stripExifAndSquare(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 512, 512);
  bitmap.close();
  // Re-encoding via canvas drops EXIF metadata
  return canvas.toDataURL("image/jpeg", 0.88);
}
