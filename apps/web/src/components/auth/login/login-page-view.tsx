"use client";

import { LoginNav } from "@/components/auth/login/login-nav";
import { LoginWelcomePanel } from "@/components/auth/login/login-welcome-panel";
import { LoginFormPanel } from "@/components/auth/login/login-form-panel";

export function LoginPageView() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <div className="animate-float-orb pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="animate-float-orb pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl [animation-delay:1.2s]" />

      <LoginNav />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2 lg:items-stretch lg:py-14">
        <div className="hidden min-h-[34rem] lg:block">
          <LoginWelcomePanel />
        </div>

        <div className="glass glow-ring rounded-3xl p-6 sm:p-8">
          <div className="mb-6 space-y-1 lg:hidden">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-300">
              HackOS
            </p>
            <p className="font-display text-xl font-bold text-white">
              Welcome back
            </p>
            <p className="text-sm text-muted">
              Sign in to your role dashboard.
            </p>
          </div>
          <LoginFormPanel />
        </div>
      </div>
    </div>
  );
}
