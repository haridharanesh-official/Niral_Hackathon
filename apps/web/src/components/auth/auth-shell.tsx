import Link from "next/link";
import { APP_NAME } from "@hackos/shared";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-50" />
      <div className="animate-float-orb pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="animate-float-orb pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl [animation-delay:1.2s]" />

      <div className={cn("relative z-10 w-full", wide ? "max-w-2xl" : "max-w-md")}>
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="glow-ring flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 font-display text-sm font-bold text-white">
            H
          </div>
          <span className="font-display text-sm font-semibold tracking-[0.2em] text-sky-300">
            {APP_NAME}
          </span>
        </Link>

        <div className="glass glow-ring rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
