import { cn } from "@/lib/utils";

export function SectionSkeleton({
  cards = 3,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-3xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] shimmer"
        />
      ))}
    </div>
  );
}
