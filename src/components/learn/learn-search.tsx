"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { apiFetch } from "@/lib/api-client";
import { TYPE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ResourceType } from "@prisma/client";
import { ProviderLogo } from "./resource-meta";

type Suggestions = {
  resources: { slug: string; title: string; type: ResourceType; provider: { name: string; logoUrl: string } }[];
  providers: { slug: string; name: string; logoUrl: string }[];
};

type Option = { key: string; label: string; sub: string; logoUrl: string; onPick: () => void };

type LearnSearchProps = {
  value: string;
  onSearch: (q: string) => void;
  onProvider: (slug: string) => void;
};

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Search with typeahead over titles and providers. "/" or ⌘K focuses it; arrows move, Enter picks. */
export function LearnSearch({ value, onSearch, onProvider }: LearnSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounced(text.trim(), 200);

  // Keep the box in sync when the URL changes (Back button, Clear all).
  useEffect(() => setText(value), [value]);

  // Applying the search as you type keeps the results live, like AI Orbit's directory.
  useEffect(() => {
    const t = setTimeout(() => {
      if (text.trim() !== value) onSearch(text.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [text, value, onSearch]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable=true]");
      if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { data } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: ({ signal }) => apiFetch<Suggestions>(`/api/learn/suggest?q=${encodeURIComponent(debounced)}`, { signal }).then((r) => r.data),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const options: Option[] =
    debounced.length >= 2 && data
      ? [
          ...data.resources.map((r) => ({
            key: `r-${r.slug}`,
            label: r.title,
            sub: `${TYPE_LABEL[r.type]} · ${r.provider.name}`,
            logoUrl: r.provider.logoUrl,
            onPick: () => router.push(`/learn/${r.slug}`),
          })),
          ...data.providers.map((p) => ({
            key: `p-${p.slug}`,
            label: p.name,
            sub: "Provider · show all resources",
            logoUrl: p.logoUrl,
            onPick: () => {
              setText("");
              onSearch("");
              onProvider(p.slug);
            },
          })),
        ]
      : [];
  const showList = open && options.length > 0;

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = showList ? options[active] : undefined;
      setOpen(false);
      if (option) option.onPick();
      else onSearch(text.trim());
    } else if (event.key === "Escape") {
      if (showList) setOpen(false);
      else if (text) setText("");
    }
  }

  return (
    <div className="relative w-full max-w-[520px]">
      <div className="flex h-12 items-center gap-3 rounded-control border border-border bg-surface px-4 transition-colors focus-within:border-border-strong hover:border-border-strong md:h-[42px]">
        <Search aria-hidden className="size-4 shrink-0 text-fg-muted" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Search courses, guides, eBooks and providers"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Search courses, guides, eBooks, providers…"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {text ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              onSearch("");
              inputRef.current?.focus();
            }}
            className="flex size-7 items-center justify-center rounded-full text-fg-muted hover:bg-hover hover:text-fg"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden h-5 items-center gap-0.5 rounded-sm border border-border bg-raised px-1.5 font-mono text-[0.625rem] text-fg-muted sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!showList}
        className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-card border border-border bg-card p-1.5 text-left shadow-float"
      >
        {options.map((option, index) => (
          <li
            key={option.key}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setOpen(false);
              option.onPick();
            }}
            onMouseEnter={() => setActive(index)}
            className={cn("flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-2", index === active && "bg-hover")}
          >
            <ProviderLogo name={option.label} logoUrl={option.logoUrl} size={28} className="rounded-sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-fg">{option.label}</span>
              <span className="flex items-center gap-1 truncate text-xs text-fg-muted">
                {option.key.startsWith("p-") ? <Building2 aria-hidden className="size-3" /> : null}
                {option.sub}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
