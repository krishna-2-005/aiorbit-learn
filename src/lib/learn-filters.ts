import { createSearchParamsCache, parseAsArrayOf, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { DURATIONS, FORMATS, LEVELS, PRICINGS, SORTS, TYPE_TABS, VIEWS } from "@/lib/constants";

const typeValues = TYPE_TABS.map((t) => t.value) as [string, ...string[]];

export const learnParsers = {
  q: parseAsString.withDefault(""),
  type: parseAsStringLiteral(typeValues).withDefault("all"),
  category: parseAsArrayOf(parseAsString).withDefault([]),
  level: parseAsArrayOf(parseAsStringLiteral(LEVELS)).withDefault([]),
  pricing: parseAsArrayOf(parseAsStringLiteral(PRICINGS)).withDefault([]),
  format: parseAsArrayOf(parseAsStringLiteral(FORMATS)).withDefault([]),
  duration: parseAsStringLiteral(DURATIONS),
  provider: parseAsString,
  sort: parseAsStringLiteral(SORTS).withDefault("trending"),
  view: parseAsStringLiteral(VIEWS).withDefault("grid"),
};

export type LearnFilters = {
  q: string;
  type: string;
  category: string[];
  level: (typeof LEVELS)[number][];
  pricing: (typeof PRICINGS)[number][];
  format: (typeof FORMATS)[number][];
  duration: (typeof DURATIONS)[number] | null;
  provider: string | null;
  sort: (typeof SORTS)[number];
  view: (typeof VIEWS)[number];
};

/** API query string for the current filters (view is UI-only and left out). */
export function filtersToSearch(filters: LearnFilters, lockedCategory?: string): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.type !== "all") params.set("type", filters.type);
  const categories = lockedCategory ? [lockedCategory] : filters.category;
  if (categories.length) params.set("category", [...categories].sort().join(","));
  if (filters.level.length) params.set("level", [...filters.level].sort().join(","));
  if (filters.pricing.length) params.set("pricing", [...filters.pricing].sort().join(","));
  if (filters.format.length) params.set("format", [...filters.format].sort().join(","));
  if (filters.duration) params.set("duration", filters.duration);
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.sort !== "trending") params.set("sort", filters.sort);
  return params.toString();
}

export const learnSearchCache = createSearchParamsCache(learnParsers);

export function activeFilterCount(filters: LearnFilters): number {
  return (
    filters.category.length +
    filters.level.length +
    filters.pricing.length +
    filters.format.length +
    (filters.duration ? 1 : 0) +
    (filters.provider ? 1 : 0)
  );
}
