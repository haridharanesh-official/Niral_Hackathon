import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "cta-primary bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] shadow-[0_2px_10px_rgba(140,59,35,0.22)] border border-transparent",
  secondary:
    "border border-[var(--card-border)] bg-white dark:bg-[#231F1C] text-[var(--foreground)] hover:border-stone-400 hover:bg-[#FAF8F5] dark:hover:bg-[#2B2622] shadow-sm",
  ghost:
    "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5",
  outline:
    "border border-[var(--card-border)] bg-transparent text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3.5 text-xs rounded-full",
  md: "h-10 px-5 text-sm rounded-full",
  lg: "h-12 px-7 text-base rounded-full",
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
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
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
