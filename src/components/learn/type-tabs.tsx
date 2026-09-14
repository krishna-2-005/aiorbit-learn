"use client";

import { LayoutGrid } from "lucide-react";
import { TYPE_TABS } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FacetCount } from "@/types/learn";
import { TYPE_ICON } from "./resource-meta";

type TypeTabsProps = {
  value: string;
  onChange: (value: string) => void;
  counts?: FacetCount[];
};

/** AI Orbit's category rail: pill buttons with an icon tile, the active one outlined in gold. */
export function TypeTabs({ value, onChange, counts }: TypeTabsProps) {
  const total = counts?.reduce((sum, c) => sum + c.count, 0);
  return (
    <nav aria-label="Resource type" className="-mx-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
      <ul className="flex w-max gap-2 py-1 md:gap-3">
        {TYPE_TABS.map((tab) => {
          const selected = tab.value === value;
          const Icon = tab.type ? TYPE_ICON[tab.type] : LayoutGrid;
          const count = tab.type ? counts?.find((c) => c.value === tab.type)?.count : total;
          return (
            <li key={tab.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(tab.value)}
                className={cn(
                  "flex h-11 items-center gap-2.5 rounded-control border py-1.5 pr-4 pl-1.5 text-[0.8125rem] font-semibold transition-colors duration-150",
                  selected
                    ? "border-gold/80 bg-gold/5 text-fg"
                    : "border-border bg-surface text-fg-soft hover:border-border-strong hover:text-fg",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border",
                    selected ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-raised text-fg-muted",
                  )}
                >
                  <Icon aria-hidden className="size-3.5" />
                </span>
                {tab.label}
                {count !== undefined ? (
                  <span className={cn("text-xs font-medium tabular-nums", selected ? "text-fg-muted" : "text-fg-subtle")}>
                    {formatCount(count)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
