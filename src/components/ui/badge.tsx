import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "green" | "gold" | "sky" | "orange" | "violet" | "solid";

/** AI Orbit pricing pill: dark fill, thin border, small dot in the tint colour. */
const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: "border-border bg-raised text-fg-muted", dot: "bg-fg-subtle" },
  accent: { box: "border-accent/40 bg-accent-soft text-accent-fg", dot: "bg-accent-fg" },
  green: { box: "border-green/25 bg-surface text-fg-soft", dot: "bg-green" },
  gold: { box: "border-gold/25 bg-surface text-fg-soft", dot: "bg-gold" },
  sky: { box: "border-sky/25 bg-surface text-fg-soft", dot: "bg-sky" },
  orange: { box: "border-orange/25 bg-surface text-fg-soft", dot: "bg-orange" },
  violet: { box: "border-violet/25 bg-surface text-fg-soft", dot: "bg-violet" },
  solid: { box: "border-transparent bg-accent text-white", dot: "bg-white" },
};

type BadgeProps = {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-medium whitespace-nowrap",
        t.box,
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", t.dot)} /> : null}
      {children}
    </span>
  );
}
