import Link from "next/link";

export function GameFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link href="/games" className="text-sm text-sky-300 hover:underline">
          ← All games
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="glass mt-6 rounded-3xl p-6">{children}</div>
      </div>
    </div>
  );
}
