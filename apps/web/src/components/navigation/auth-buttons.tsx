import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackAnalytics } from "@/hooks/use-analytics";

export function LoginButton({
  fullWidth,
  onNavigate,
}: {
  fullWidth?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href="/login" onClick={onNavigate}>
      <Button variant={fullWidth ? "secondary" : "ghost"} size="sm" className={fullWidth ? "w-full" : undefined}>
        Login
      </Button>
    </Link>
  );
}

export function RegisterButton({
  fullWidth,
  onNavigate,
}: {
  fullWidth?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/register"
      onClick={() => {
        trackAnalytics("registration_started", { source: "nav" });
        onNavigate?.();
      }}
    >
      <Button size="sm" className={fullWidth ? "cta-primary w-full" : "cta-primary"}>
        Register
      </Button>
    </Link>
  );
}
