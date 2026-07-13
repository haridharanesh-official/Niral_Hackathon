import Link from "next/link";
import { APP_NAME } from "@hackos/shared";
import { Button } from "@/components/ui/button";

async function getApiInfo() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  try {
    const [infoRes, healthRes] = await Promise.all([
      fetch(`${base}/api`, { next: { revalidate: 10 } }),
      fetch(`${base}/api/health`, { next: { revalidate: 10 } }),
    ]);

    const info = infoRes.ok ? await infoRes.json() : null;
    const health = healthRes.ok ? await healthRes.json() : null;

    return { info, health, error: null as string | null };
  } catch {
    return {
      info: null,
      health: null,
      error: "API unreachable. Start the NestJS server on port 4000.",
    };
  }
}

export default async function ApiStatusPage() {
  const { info, health, error } = await getApiInfo();

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Back to {APP_NAME}
          </Button>
        </Link>

        <div className="glass mt-6 rounded-3xl p-8">
          <h1 className="font-display text-3xl font-bold text-white">
            System Status
          </h1>
          <p className="mt-2 text-muted">
            Live probe of the HackOS API health endpoint.
          </p>

          {error ? (
            <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {error}
            </p>
          ) : null}

          <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-sky-100">
            {JSON.stringify({ info, health }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
