import { cn } from "@/lib/utils";

/** Placeholder block with a slow, low-contrast shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-control", className)} />;
}
