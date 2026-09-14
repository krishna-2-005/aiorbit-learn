"use client";

import { useQueryStates } from "nuqs";
import { learnParsers, type LearnFilters } from "@/lib/learn-filters";

/** Every filter, sort and view lives in the URL; each change is a history entry so Back undoes it. */
export function useLearnFilters() {
  const [filters, setFilters] = useQueryStates(learnParsers, { history: "push", scroll: false, clearOnDefault: true });
  return { filters: filters as LearnFilters, setFilters };
}
