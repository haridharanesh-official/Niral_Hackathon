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
      <Button
        variant="secondary"
        size="sm"
        className={fullWidth ? "w-full rounded-full" : "rounded-full px-4"}
      >
        Sign in
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
      <Button
        size="sm"
        variant="primary"
        className={fullWidth ? "w-full rounded-full" : "rounded-full px-4"}
      >
        Register
      </Button>
    </Link>
  );
}
