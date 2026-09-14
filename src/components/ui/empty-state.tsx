import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  /** Say what to do next, e.g. "Clear filters or try a broader search." */
  description: string;
  action?: ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
};

export function EmptyState({ icon, title, description, action, className, headingLevel = "h3" }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border border-border bg-card px-6 py-14 text-center animate-fade-in",
        className,
      )}
    >
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-fg-muted [&>svg]:size-5">
          {icon}
        </span>
      ) : null}
      <div className="flex max-w-[44ch] flex-col gap-1.5">
        <Heading className="text-lg font-semibold text-fg">{title}</Heading>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
