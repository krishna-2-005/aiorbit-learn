"use client";

import { Share2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Uses the native share sheet on phones, otherwise copies the link. */
export function ShareButton({ title, path, className, iconOnly = false }: { title: string; path: string; className?: string; iconOnly?: boolean }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={iconOnly ? `Share ${title}` : undefined}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg transition-colors hover:border-border-strong hover:bg-raised active:scale-[0.98]",
        iconOnly && "w-10 px-0",
        className,
      )}
    >
      <Share2 aria-hidden className="size-4" />
      {iconOnly ? null : "Share"}
    </button>
  );
}
