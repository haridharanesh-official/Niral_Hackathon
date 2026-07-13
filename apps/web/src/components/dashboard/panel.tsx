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
    <section className={cn("glass rounded-3xl p-5 sm:p-6", className)}>
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
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
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
