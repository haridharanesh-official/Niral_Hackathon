import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "cta-primary bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-[0_0_28px_rgba(56,189,248,0.35)]",
  secondary:
    "glass text-foreground hover:border-sky-400/40 hover:bg-sky-500/10",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/5",
  outline:
    "border border-sky-400/30 bg-transparent text-sky-300 hover:bg-sky-500/10",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
