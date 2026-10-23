"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { pushSecurityNotice } from "@/components/auth/login/session-tracker";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(280).optional(),
  image: z.string().url().or(z.literal("")).optional(),
  college: z.string().optional(),
  department: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const { register, handleSubmit, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((res) => res.json())
      .then((user) => {
        reset({
          name: user.name ?? "",
          bio: user.bio ?? "",
          image: user.image ?? "",
          college: user.college ?? "",
          department: user.department ?? "",
        });
        setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
      })
      .catch(() => undefined);
  }, [session?.accessToken, reset]);

  const saveProfile = handleSubmit(async (values) => {
    if (!session?.accessToken) return;
    setMessage(null);

    const response = await fetch(`${apiUrl}/api/auth/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        image: values.image || undefined,
      }),
    });

    if (!response.ok) {
      setMessage("Failed to update profile");
      return;
    }

    setMessage("Profile updated");
  });

  async function setup2FA() {
    if (!session?.accessToken) return;
    const response = await fetch(`${apiUrl}/api/auth/2fa/setup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await response.json();
    setQr(data.qrCodeDataUrl);
    setSecret(data.secret);
    setBackupCodes(null);
  }

  async function enable2FA() {
    if (!session?.accessToken) return;
    const response = await fetch(`${apiUrl}/api/auth/2fa/enable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "Failed to enable 2FA");
      return;
    }
    setTwoFactorEnabled(true);
    setBackupCodes(data.backupCodes ?? null);
    setMessage(data.message ?? "2FA enabled");
    pushSecurityNotice({
      type: "2FA_ENABLED",
      title: "Two-factor authentication enabled",
      detail: "Authenticator app enrolled for this account",
      at: new Date().toISOString(),
    });
  }

  async function disable2FA() {
    if (!session?.accessToken || !code) return;
    const response = await fetch(`${apiUrl}/api/auth/2fa/disable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "Failed to disable 2FA");
      return;
    }
    setTwoFactorEnabled(false);
    setQr(null);
    setSecret(null);
    setBackupCodes(null);
    setMessage(data.message ?? "2FA disabled");
    pushSecurityNotice({
      type: "2FA_DISABLED",
      title: "Two-factor authentication disabled",
      detail: "Authenticator protection was turned off",
      at: new Date().toISOString(),
    });
  }

  async function regenerateBackups() {
    if (!session?.accessToken || !code) return;
    const response = await fetch(`${apiUrl}/api/auth/2fa/backup-codes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "Could not regenerate backup codes");
      return;
    }
    setBackupCodes(data.backupCodes ?? null);
    setMessage(data.message ?? "Backup codes regenerated");
  }

  function downloadBackupCodes() {
    if (!backupCodes?.length) return;
    const blob = new Blob(
      [
        "HackOS 2FA backup codes\n",
        "Store these securely. Each code works once.\n\n",
        backupCodes.join("\n"),
        "\n",
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hackos-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard" className="text-sky-300 hover:underline">
            ← Back to dashboard
          </Link>
          <Link href="/dashboard/security" className="text-sky-300 hover:underline">
            Sessions &amp; security
          </Link>
        </div>

        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Update your identity and profile picture URL.
          </p>

          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <input className="field-input" placeholder="Name" {...register("name")} />
            <input
              className="field-input"
              placeholder="Profile image URL"
              {...register("image")}
            />
            <textarea
              className="field-input min-h-24"
              placeholder="Bio"
              {...register("bio")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="field-input"
                placeholder="College"
                {...register("college")}
              />
              <input
                className="field-input"
                placeholder="Department"
                {...register("department")}
              />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </div>

        <div className="glass rounded-3xl p-8">
          <h2 className="font-display text-xl font-bold text-white">
            Two-factor authentication
          </h2>
          <p className="mt-1 text-sm text-muted">
            Recommended: authenticator app. Status:{" "}
            <span className={twoFactorEnabled ? "text-emerald-300" : "text-orange-200"}>
              {twoFactorEnabled ? "Enabled" : "Not enabled"}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={setup2FA}>
              {twoFactorEnabled ? "Re-enroll (setup)" : "Setup 2FA"}
            </Button>
          </div>
          {qr ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted">
                1. Scan this QR code with your authenticator app
                <br />
                2. Enter the 6-digit code to confirm
                <br />
                3. Save your backup codes somewhere safe
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="2FA QR code" className="h-48 w-48 rounded-xl bg-white p-2" />
              <p className="break-all font-mono text-xs text-violet-200">
                Secret: {secret}
              </p>
              <input
                className="field-input max-w-xs"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={enable2FA}>
                  Enable 2FA
                </Button>
              </div>
            </div>
          ) : null}

          {twoFactorEnabled ? (
            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <input
                className="field-input max-w-xs"
                placeholder="Code to disable / regenerate"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={regenerateBackups}>
                  Regenerate backup codes
                </Button>
                <Button type="button" variant="ghost" onClick={disable2FA}>
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : null}

          {backupCodes?.length ? (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-100">
                Backup codes (download now — shown once)
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-amber-50/90">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                variant="secondary"
                onClick={downloadBackupCodes}
              >
                Download codes
              </Button>
            </div>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
