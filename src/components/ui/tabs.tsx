"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: string;
  count?: number;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  /** Accessible name for the tab list. */
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

/** WAI-ARIA tabs: arrow keys move between tabs, Home/End jump, panels are linked. */
export function Tabs({ items, label, defaultValue, value, onValueChange, className }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? "");
  const current = value ?? internal;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = items.length - 1;
    const target =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    const item = items[target];
    if (!item) return;
    select(item.value);
    tabRefs.current[target]?.focus();
  }

  const active = items.find((item) => item.value === current) ?? items[0];

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-border">
        {items.map((item, index) => {
          const selected = item.value === active?.value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "-mb-px flex h-11 items-center gap-2 rounded-t-control border-b-2 text-sm font-medium whitespace-nowrap",
                selected
                  ? "border-white text-fg"
                  : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="text-sm font-normal text-fg-muted">{formatCount(item.count)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.value}`}
          aria-labelledby={`${baseId}-tab-${active.value}`}
          tabIndex={0}
          className="pt-6 focus-visible:outline-offset-4"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
