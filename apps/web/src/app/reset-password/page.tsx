import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
