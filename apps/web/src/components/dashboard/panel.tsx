import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition hover:border-stone-400",
        className,
      )}
    >
      <h2 className="font-sans text-xl font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StatChip({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3.5 shadow-sm transition hover:border-stone-400">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-sans text-2xl font-bold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
