import { cn } from "@/lib/utils";

export function ProgressBar({ percent, label, className, size = "md" }: { percent: number; label: string; className?: string; size?: "sm" | "md" }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("w-full overflow-hidden rounded-full bg-raised", size === "sm" ? "h-1" : "h-1.5", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", value === 100 ? "bg-green" : "bg-accent")}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
