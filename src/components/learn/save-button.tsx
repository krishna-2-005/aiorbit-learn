"use client";

import { Bookmark } from "lucide-react";
import { useIsSaved, useToggleSave } from "@/hooks/use-saved";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  slug: string;
  title: string;
  variant?: "icon" | "pill";
  initialSaved?: boolean;
  className?: string;
};

export function SaveButton({ slug, title, variant = "icon", initialSaved = false, className }: SaveButtonProps) {
  const saved = useIsSaved(slug, initialSaved);
  const toggle = useToggleSave();

  const label = saved ? `Remove ${title} from library` : `Save ${title}`;
  const icon = <Bookmark aria-hidden className={cn("size-4 transition-colors", saved && "fill-accent-fg text-accent-fg")} />;

  if (variant === "pill") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => toggle(slug, !saved, title)}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.98]",
          saved ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-border bg-surface text-fg hover:border-border-strong hover:bg-raised",
          className,
        )}
      >
        {icon}
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(slug, !saved, title);
      }}
      className={cn(
        "relative z-10 flex size-9 items-center justify-center rounded-control border transition-colors active:scale-95 md:size-8",
        saved ? "border-accent/50 bg-accent-soft" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
        className,
      )}
    >
      {icon}
    </button>
  );
}
