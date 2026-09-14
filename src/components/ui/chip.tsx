import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

const base =
  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-150 md:h-8";

// AI Orbit category pills: dark with a faint border; the active one is solid white.
const idle = "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg";
const active = "border-white bg-white text-black";

type CommonProps = {
  children: ReactNode;
  /** Muted number after the label, e.g. resources per category. */
  count?: number;
  icon?: ReactNode;
  className?: string;
};

type ToggleChipProps = CommonProps & {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  disabled?: boolean;
};

/** Selectable filter chip. Announced as a toggle button. */
export function Chip({ selected, onSelectedChange, disabled, count, icon, className, children }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelectedChange(!selected)}
      className={cn(base, selected ? active : idle, "disabled:opacity-40 [&>svg]:size-3.5", className)}
    >
      {icon}
      {children}
      {count !== undefined ? <ChipCount count={count} selected={selected} /> : null}
    </button>
  );
}

type LinkChipProps = CommonProps & { href: string; active?: boolean };

export function LinkChip({ href, count, icon, active: isActive = false, className, children }: LinkChipProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(base, isActive ? active : idle, "[&>svg]:size-3.5", className)}
    >
      {icon}
      {children}
      {count !== undefined ? <ChipCount count={count} selected={isActive} /> : null}
    </Link>
  );
}

type RemovableChipProps = {
  children: string;
  onRemove: () => void;
  className?: string;
};

/** Active filter chip with a remove action, e.g. "Beginner ×". */
export function RemovableChip({ children, onRemove, className }: RemovableChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${children}`}
      className={cn(base, "h-8 border-accent/40 bg-accent-soft pr-2 text-accent-fg hover:border-accent md:h-7", className)}
    >
      {children}
      <X aria-hidden className="size-3.5" />
    </button>
  );
}

function ChipCount({ count, selected = false }: { count: number; selected?: boolean }) {
  return <span className={cn("font-normal tabular-nums", selected ? "text-black/60" : "text-fg-subtle")}>{formatCount(count)}</span>;
}
