"use client";

import { ArrowDownUp, Clock, Flame, LayoutGrid, List, Sparkles, Star, Bookmark } from "lucide-react";
import { SORT_LABEL, SORTS, type Sort, type View } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SORT_PILL: Record<Sort, { icon: typeof Flame; ring: string; iconColor: string }> = {
  trending: { icon: Flame, ring: "border-orange/25", iconColor: "text-orange" },
  rating: { icon: Star, ring: "border-sky/25", iconColor: "text-sky" },
  newest: { icon: Sparkles, ring: "border-violet/25", iconColor: "text-violet" },
  saved: { icon: Bookmark, ring: "border-gold/25", iconColor: "text-gold" },
  shortest: { icon: Clock, ring: "border-green/25", iconColor: "text-green" },
};

const PILL_ORDER: Sort[] = ["trending", "rating", "newest", "saved", "shortest"];

/** The tinted quick-sort pills under AI Orbit's hero search. */
export function SortPills({ value, onChange }: { value: Sort; onChange: (sort: Sort) => void }) {
  return (
    <ul aria-label="Quick sort" className="flex flex-wrap justify-center gap-2">
      {PILL_ORDER.map((sort) => {
        const { icon: Icon, ring, iconColor } = SORT_PILL[sort];
        const selected = sort === value;
        return (
          <li key={sort}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(sort)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all duration-150 active:scale-95 md:h-[26px] md:px-2.5 md:text-[0.6875rem]",
                selected ? "border-white bg-white text-black" : cn(ring, "bg-surface text-fg-muted hover:text-fg"),
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded-full border", selected ? "border-black/15" : ring)}>
                <Icon aria-hidden className={cn("size-2.5", selected ? "text-black" : iconColor)} />
              </span>
              {SORT_LABEL[sort]}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SortSelect({ value, onChange }: { value: Sort; onChange: (sort: Sort) => void }) {
  return (
    <label className="relative inline-flex h-9 items-center rounded-full border border-border bg-surface pr-3 pl-3 text-[0.8125rem] text-fg-soft hover:border-border-strong md:h-8">
      <ArrowDownUp aria-hidden className="pointer-events-none size-3.5 text-fg-muted" />
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Sort)}
        className="h-full appearance-none bg-transparent pr-1 pl-2 font-medium text-fg-soft outline-none [&>option]:bg-card"
      >
        {SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABEL[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: View; onChange: (view: View) => void }) {
  const items: { view: View; icon: typeof List; label: string }[] = [
    { view: "grid", icon: LayoutGrid, label: "Grid view" },
    { view: "list", icon: List, label: "List view" },
  ];
  return (
    <div role="group" aria-label="Layout" className="inline-flex h-9 items-center rounded-full border border-border bg-surface p-0.5 md:h-8">
      {items.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          type="button"
          aria-pressed={value === view}
          aria-label={label}
          title={label}
          onClick={() => onChange(view)}
          className={cn(
            "flex h-full w-9 items-center justify-center rounded-full transition-colors md:w-8",
            value === view ? "bg-white text-black" : "text-fg-muted hover:text-fg",
          )}
        >
          <Icon aria-hidden className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
