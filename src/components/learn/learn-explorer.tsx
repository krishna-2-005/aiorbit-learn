"use client";

import { AnimatePresence, m } from "framer-motion";
import { SearchX, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip, RemovableChip } from "@/components/ui/chip";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { useLearnFilters } from "@/hooks/use-learn-filters";
import { useFacets, useResources, type ListPage } from "@/hooks/use-resources";
import { DURATION_LABEL, DURATIONS, FORMAT_LABEL, LEVEL_LABEL, PRICING_LABEL, TYPE_TABS, type Sort, type View } from "@/lib/constants";
import { formatCount, formatRelative } from "@/lib/format";
import { activeFilterCount, filtersToSearch, type LearnFilters } from "@/lib/learn-filters";
import { cn } from "@/lib/utils";
import type { Facets, FacetCount, ProviderWithCount, ResourceListItem } from "@/types/learn";
import { Container } from "@/components/layout/container";
import { FilterMenu } from "./filter-menu";
import { LearnSearch } from "./learn-search";
import { SortPills, SortSelect, ViewToggle } from "./listing-controls";
import { GRID_CLASSES, ResultsSkeleton } from "./listing-skeleton";
import { ResourceCard } from "./resource-card";
import { ResourceRow } from "./resource-row";
import { ProviderLogo } from "./resource-meta";
import { TypeTabs } from "./type-tabs";

type LearnExplorerProps = {
  hero: { eyebrow: string; title: string; subtitle: string; total: number; lastUpdated: string | null };
  initial: { search: string; page: ListPage; facets: Facets };
  providers: ProviderWithCount[];
  featured: ResourceListItem[];
  /** Category pages lock the category filter and hide its chips. */
  lockedCategory?: string;
};

export function LearnExplorer({ hero, initial, providers, featured, lockedCategory }: LearnExplorerProps) {
  const { filters, setFilters } = useLearnFilters();
  const search = filtersToSearch(filters, lockedCategory);
  const resources = useResources(search, initial);
  const facetsQuery = useFacets(search, initial);
  const facets = facetsQuery.data ?? initial.facets;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filterCount = activeFilterCount({ ...filters, category: lockedCategory ? [] : filters.category });
  const pristine = filterCount === 0 && !filters.q && filters.type === "all";

  const set = useCallback((patch: Partial<LearnFilters>) => void setFilters(patch), [setFilters]);
  const onSearch = useCallback((q: string) => void setFilters({ q }, { history: "replace" }), [setFilters]);
  const onProvider = useCallback((provider: string) => void setFilters({ provider }), [setFilters]);
  const clearAll = () =>
    void setFilters({ q: "", type: "all", category: [], level: [], pricing: [], format: [], duration: null, provider: null });

  const pages = resources.data?.pages ?? [];
  const items = pages.flatMap((p) => p.data);
  const total = pages[0]?.meta.total ?? 0;
  const remaining = Math.max(0, total - items.length);
  const view: View = filters.view;
  const busy = resources.isFetching && !resources.isFetchingNextPage;

  const providerOptions = useMemo(
    () =>
      providers.map((p) => ({
        value: p.slug,
        label: p.name,
        count: p.count,
        icon: <ProviderLogo name={p.name} logoUrl={p.logoUrl} size={18} className="rounded-sm" />,
      })),
    [providers],
  );

  const menus = (
    <>
      <FilterMenu label="Level" options={options(facets.level)} selected={filters.level} onChange={(level) => set({ level: level as LearnFilters["level"] })} />
      <FilterMenu label="Price" options={options(facets.pricing)} selected={filters.pricing} onChange={(pricing) => set({ pricing: pricing as LearnFilters["pricing"] })} />
      <FilterMenu label="Format" options={options(facets.format)} selected={filters.format} onChange={(format) => set({ format: format as LearnFilters["format"] })} />
      <FilterMenu
        label="Duration"
        single
        options={DURATIONS.map((d) => ({ value: d, label: DURATION_LABEL[d] }))}
        selected={filters.duration ? [filters.duration] : []}
        onChange={([duration]) => set({ duration: (duration as LearnFilters["duration"]) ?? null })}
      />
      <FilterMenu
        label="Provider"
        single
        searchable
        options={providerOptions}
        selected={filters.provider ? [filters.provider] : []}
        onChange={([provider]) => set({ provider: provider ?? null })}
      />
    </>
  );

  return (
    <>
      {/* Hero */}
      <section className="hero-glow border-b border-border-subtle">
        <Container className="flex flex-col items-center gap-5 pt-12 pb-10 text-center md:pt-16 md:pb-12">
          <p className="eyebrow text-accent-fg">{hero.eyebrow}</p>
          <h1 className="max-w-3xl text-[2rem] leading-[1.1] font-black tracking-[-0.025em] text-fg sm:text-[2.75rem]">{hero.title}</h1>
          <p className="max-w-xl text-[0.9375rem] text-fg-muted">{hero.subtitle}</p>
          <LearnSearch value={filters.q} onSearch={onSearch} onProvider={onProvider} />
          <SortPills value={filters.sort} onChange={(sort: Sort) => set({ sort })} />
          <p className="text-xs text-fg-subtle">
            <span className="font-semibold text-fg-muted">{formatCount(hero.total)}</span> resources
            {hero.lastUpdated ? <> · updated {formatRelative(hero.lastUpdated)}</> : null}
          </p>
        </Container>
      </section>

      <Container className="flex flex-col gap-5 pt-6">
        <TypeTabs value={filters.type} onChange={(type) => set({ type })} counts={facets.type} />
      </Container>

      {/* Filter bar: sticky under the navbar on desktop */}
      <div className="sticky top-[61px] z-20 mt-4 border-y border-border-subtle bg-black/85 backdrop-blur-md">
        <Container className="flex flex-col gap-3 py-3">
          {!lockedCategory ? (
            <div className="-mx-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
              <ul aria-label="Categories" className="flex w-max gap-2">
                <li>
                  <Chip selected={filters.category.length === 0} onSelectedChange={() => set({ category: [] })}>
                    All
                  </Chip>
                </li>
                {facets.category.map((c) => (
                  <li key={c.value}>
                    <Chip
                      selected={filters.category.includes(c.value)}
                      count={c.count}
                      onSelectedChange={(on) =>
                        set({ category: on ? [...filters.category, c.value] : filters.category.filter((v) => v !== c.value) })
                      }
                    >
                      {c.label}
                    </Chip>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <div className="hidden flex-wrap items-center gap-2 md:flex">{menus}</div>
            <Button
              variant="secondary"
              size="sm"
              className="md:hidden"
              icon={<SlidersHorizontal aria-hidden />}
              onClick={() => setDrawerOpen(true)}
            >
              Filters
              {filterCount ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-bold text-white">
                  {filterCount}
                </span>
              ) : null}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <SortSelect value={filters.sort} onChange={(sort) => set({ sort })} />
              <ViewToggle value={view} onChange={(v) => set({ view: v })} />
            </div>
          </div>
        </Container>
      </div>

      <Container className="flex flex-col gap-6 pt-6">
        {/* Result count + active filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-fg-muted">
            {resources.isError ? (
              "Couldn't load resources"
            ) : (
              <>
                <span className="font-semibold text-fg">{formatCount(total)}</span> {total === 1 ? "resource" : "resources"}
                {filters.q ? (
                  <>
                    {" "}
                    for “<span className="text-fg">{filters.q}</span>”
                  </>
                ) : null}
              </>
            )}
          </p>
          <ActiveFilters filters={filters} providers={providers} facets={facets} lockedCategory={lockedCategory} set={set} clearAll={clearAll} />
        </div>

        {pristine && featured.length > 0 && !lockedCategory ? (
          <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 id="featured-heading" className="eyebrow text-fg">
                Editor&apos;s picks
              </h2>
              <span aria-hidden className="h-px flex-1 bg-border-subtle" />
            </div>
            <div className={GRID_CLASSES}>
              {featured.map((r, i) => (
                <ResourceCard key={r.id} resource={r} priority={i < 2} />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <h2 className="eyebrow text-fg">All resources</h2>
              <span aria-hidden className="h-px flex-1 bg-border-subtle" />
            </div>
          </section>
        ) : null}

        <div aria-busy={busy} className={cn("transition-opacity duration-150", busy && "opacity-60")}>
          {resources.isPending ? (
            <ResultsSkeleton view={view} />
          ) : resources.isError && items.length === 0 ? (
            <EmptyState
              icon={<TriangleAlert />}
              title="Couldn't load resources"
              description={resources.error.message}
              action={<Button onClick={() => void resources.refetch()}>Try again</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No resources match"
              description={filters.q ? `Nothing matches “${filters.q}” with these filters. Try a broader search or clear a filter.` : "Try removing a filter or picking a different type."}
              action={<Button variant="white" onClick={clearAll}>Clear filters</Button>}
            />
          ) : view === "grid" ? (
            <ul className={GRID_CLASSES}>
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((r, i) => (
                  <m.li key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <ResourceCard resource={r} priority={i < 3 && !pristine} />
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <div className="overflow-hidden rounded-card border border-border bg-card">
              <div className="hidden items-center gap-4 border-b border-border bg-surface px-4 py-2.5 text-[0.6875rem] font-semibold tracking-wider text-fg-muted uppercase sm:flex">
                <span className="w-40 shrink-0">Resource</span>
                <span className="flex-1" />
                <span className="hidden w-28 md:block">Pricing</span>
                <span className="w-28">Rating</span>
                <span className="w-8 text-center">Save</span>
              </div>
              <ul>
                {items.map((r, i) => (
                  <ResourceRow key={r.id} resource={r} priority={i < 4} />
                ))}
              </ul>
            </div>
          )}
        </div>

        {items.length > 0 && resources.hasNextPage ? (
          <div className="flex flex-col items-center gap-2">
            {resources.isFetchNextPageError ? (
              <p role="alert" className="text-sm text-danger">
                Couldn&apos;t load more. {resources.error?.message}
              </p>
            ) : null}
            <Button
              variant="secondary"
              size="lg"
              loading={resources.isFetchingNextPage}
              loadingText="Loading…"
              onClick={() => void resources.fetchNextPage()}
            >
              Load {Math.min(12, remaining)} more
              <span className="font-normal text-fg-subtle">· {formatCount(remaining)} left</span>
            </Button>
          </div>
        ) : items.length > 0 ? (
          <p className="text-center text-xs text-fg-subtle">You&apos;ve reached the end · {formatCount(total)} resources</p>
        ) : null}
      </Container>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={clearAll}>
              Clear all
            </Button>
            <Button variant="white" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Show {formatCount(total)} results
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <DrawerGroup title="Level" items={options(facets.level)} selected={filters.level} onToggle={(v) => set({ level: toggle(filters.level, v) })} />
          <DrawerGroup title="Price" items={options(facets.pricing)} selected={filters.pricing} onToggle={(v) => set({ pricing: toggle(filters.pricing, v) })} />
          <DrawerGroup title="Format" items={options(facets.format)} selected={filters.format} onToggle={(v) => set({ format: toggle(filters.format, v) })} />
          <DrawerGroup
            title="Duration"
            items={DURATIONS.map((d) => ({ value: d, label: DURATION_LABEL[d] }))}
            selected={filters.duration ? [filters.duration] : []}
            onToggle={(v) => set({ duration: filters.duration === v ? null : (v as LearnFilters["duration"]) })}
          />
          <DrawerGroup
            title="Provider"
            items={providers.map((p) => ({ value: p.slug, label: p.name, count: p.count }))}
            selected={filters.provider ? [filters.provider] : []}
            onToggle={(v) => set({ provider: filters.provider === v ? null : v })}
          />
        </div>
      </Drawer>
    </>
  );
}

function options(counts: FacetCount[]) {
  return counts.map((c) => ({ value: c.value, label: c.label, count: c.count }));
}

function toggle<T extends string>(list: T[], value: string): T[] {
  return list.includes(value as T) ? list.filter((v) => v !== value) : [...list, value as T];
}

function DrawerGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { value: string; label: string; count?: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow mb-3 text-fg-muted">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item.value} selected={selected.includes(item.value)} count={item.count} onSelectedChange={() => onToggle(item.value)}>
            {item.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

function ActiveFilters({
  filters,
  providers,
  facets,
  lockedCategory,
  set,
  clearAll,
}: {
  filters: LearnFilters;
  providers: ProviderWithCount[];
  facets: Facets;
  lockedCategory?: string;
  set: (patch: Partial<LearnFilters>) => void;
  clearAll: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.type !== "all") {
    chips.push({ key: "type", label: TYPE_TABS.find((t) => t.value === filters.type)?.label ?? filters.type, remove: () => set({ type: "all" }) });
  }
  if (!lockedCategory) {
    for (const c of filters.category) {
      chips.push({
        key: `c-${c}`,
        label: facets.category.find((f) => f.value === c)?.label ?? c,
        remove: () => set({ category: filters.category.filter((v) => v !== c) }),
      });
    }
  }
  for (const l of filters.level) chips.push({ key: `l-${l}`, label: LEVEL_LABEL[l], remove: () => set({ level: filters.level.filter((v) => v !== l) }) });
  for (const p of filters.pricing) chips.push({ key: `p-${p}`, label: PRICING_LABEL[p], remove: () => set({ pricing: filters.pricing.filter((v) => v !== p) }) });
  for (const f of filters.format) chips.push({ key: `f-${f}`, label: FORMAT_LABEL[f], remove: () => set({ format: filters.format.filter((v) => v !== f) }) });
  if (filters.duration) chips.push({ key: "d", label: DURATION_LABEL[filters.duration], remove: () => set({ duration: null }) });
  if (filters.provider) {
    chips.push({ key: "pr", label: providers.find((p) => p.slug === filters.provider)?.name ?? filters.provider, remove: () => set({ provider: null }) });
  }
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, remove: () => set({ q: "" }) });

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <RemovableChip key={chip.key} onRemove={chip.remove}>
          {chip.label}
        </RemovableChip>
      ))}
      <button type="button" onClick={clearAll} className="h-8 px-2 text-xs font-semibold text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        Clear all
      </button>
    </div>
  );
}
