"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MenuOption = { value: string; label: string; count?: number; icon?: ReactNode };

type FilterMenuProps = {
  label: string;
  options: MenuOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Single choice (radio) instead of multi (checkbox). */
  single?: boolean;
  searchable?: boolean;
  align?: "left" | "right";
};

/** Dropdown filter pill. Closes on outside click and Escape, and returns focus to its button. */
export function FilterMenu({ label, options, selected, onChange, single, searchable, align = "left" }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = selected.length;
  const selectedLabel = single && count ? options.find((o) => o.value === selected[0])?.label : null;
  const visible = term ? options.filter((o) => o.label.toLowerCase().includes(term.toLowerCase())) : options;

  function toggle(value: string) {
    if (single) {
      onChange(selected[0] === value ? [] : [value]);
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors md:h-8",
          count ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-border bg-surface text-fg-soft hover:border-border-strong hover:text-fg",
        )}
      >
        {selectedLabel ?? label}
        {count && !single ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-bold text-white">{count}</span>
        ) : null}
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "absolute top-full z-30 mt-2 w-64 rounded-card border border-border bg-card p-1.5 shadow-float animate-fade-in",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {searchable ? (
          <label className="mb-1.5 flex h-9 items-center gap-2 rounded-control border border-border bg-surface px-2.5">
            <Search aria-hidden className="size-3.5 text-fg-muted" />
            <span className="sr-only">Search {label.toLowerCase()}</span>
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="min-w-0 flex-1 bg-transparent text-[0.8125rem] text-fg outline-none placeholder:text-fg-subtle"
            />
          </label>
        ) : null}
        <fieldset className="max-h-72 overflow-y-auto">
          <legend className="sr-only">{label}</legend>
          {visible.length === 0 ? <p className="px-2.5 py-3 text-[0.8125rem] text-fg-muted">No matches</p> : null}
          {visible.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-[0.8125rem] text-fg-soft hover:bg-hover has-focus-visible:bg-hover"
              >
                <input
                  type={single ? "radio" : "checkbox"}
                  name={single ? panelId : undefined}
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center border transition-colors",
                    single ? "rounded-full" : "rounded-sm",
                    checked ? "border-accent bg-accent text-white" : "border-border-strong bg-surface",
                  )}
                >
                  {checked ? <Check strokeWidth={3} className="size-3" /> : null}
                </span>
                {option.icon}
                <span className="flex-1 truncate">{option.label}</span>
                {option.count !== undefined ? <span className="text-xs text-fg-subtle tabular-nums">{formatCount(option.count)}</span> : null}
              </label>
            );
          })}
        </fieldset>
        {count ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 flex h-8 w-full items-center justify-center rounded-control border-t border-border-subtle text-xs font-semibold text-fg-muted hover:text-fg"
          >
            Clear {label.toLowerCase()}
          </button>
        ) : null}
      </div>
    </div>
  );
}
