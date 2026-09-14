import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "white" | "secondary" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-[background-color,border-color,color,filter,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&>svg]:size-4";

const variants: Record<ButtonVariant, string> = {
  // AI Orbit's "Submit Tool" purple pill.
  primary: "rounded-full bg-accent text-white hover:brightness-110",
  // White CTA used for primary actions on detail pages.
  white: "rounded-full bg-white text-black hover:bg-fg-soft",
  // "Log In": outlined pill on black.
  secondary: "rounded-full border border-border bg-surface text-fg hover:border-border-strong hover:bg-raised",
  ghost: "rounded-full text-fg-muted hover:bg-hover hover:text-fg",
  danger: "rounded-full border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
};

// sm keeps a 40px hit target on touch, 32px from md up.
const sizes: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs md:h-7",
  sm: "h-10 px-3.5 text-[0.8125rem] md:h-8",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[0.9375rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and announces it as busy. */
  loading?: boolean;
  /** Label shown while loading, e.g. "Saving…". */
  loadingText?: string;
  icon?: ReactNode;
};

export function Button({
  variant,
  size,
  loading = false,
  loadingText,
  icon,
  className,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function ButtonLink({ variant, size, icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
