"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

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
    setMessage(data.message ?? (response.ok ? "2FA enabled" : "Failed"));
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
        <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
          ← Back to dashboard
        </Link>

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
            Secure your account with an authenticator app.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={setup2FA}>
              Setup 2FA
            </Button>
          </div>
          {qr ? (
            <div className="mt-4 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="2FA QR code" className="h-48 w-48 rounded-xl bg-white p-2" />
              <p className="font-mono text-xs text-violet-200 break-all">Secret: {secret}</p>
              <input
                className="field-input max-w-xs"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button type="button" onClick={enable2FA}>
                Enable 2FA
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
