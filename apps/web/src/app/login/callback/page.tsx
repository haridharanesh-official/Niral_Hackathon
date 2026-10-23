"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { dashboardPathForRole } from "@/components/auth/login/login-utils";
import { recordLoginSession } from "@/components/auth/login/session-tracker";

export default function LoginCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      recordLoginSession();
      router.replace(dashboardPathForRole(session.user.role));
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass rounded-3xl px-6 py-8 text-center">
        <p className="font-display text-lg text-white">Signing you in…</p>
        <p className="mt-2 text-sm text-muted">
          Routing to your role dashboard.
        </p>
      </div>
    </div>
  );
}
