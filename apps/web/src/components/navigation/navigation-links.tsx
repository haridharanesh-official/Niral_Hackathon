export const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#tracks", label: "Tracks" },
  { href: "#problems", label: "Problem Statements" },
  { href: "#timeline", label: "Schedule" },
  { href: "#rules", label: "Rules" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
] as const;

export function NavigationLinks({
  onNavigate,
  className = "hidden items-center gap-5 lg:flex",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Primary">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-sm text-sm text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          onClick={onNavigate}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
