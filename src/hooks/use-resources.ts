"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PAGE_SIZE } from "@/lib/constants";
import type { Facets, ListMeta, ResourceListItem } from "@/types/learn";

export type ListPage = { data: ResourceListItem[]; meta: ListMeta };

export function useResources(search: string, initial?: { search: string; page: ListPage }) {
  const useInitial = initial && initial.search === search;
  return useInfiniteQuery({
    queryKey: ["resources", search],
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams(search);
      params.set("limit", String(PAGE_SIZE));
      if (pageParam) params.set("cursor", pageParam);
      return apiFetch<ResourceListItem[], ListMeta>(`/api/learn?${params}`, { signal });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta.nextCursor,
    initialData: useInitial ? { pages: [initial.page], pageParams: [null] } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useFacets(search: string, initial?: { search: string; facets: Facets }) {
  const useInitial = initial && initial.search === search;
  return useQuery({
    queryKey: ["facets", search],
    queryFn: ({ signal }) => apiFetch<Facets>(`/api/learn/facets?${search}`, { signal }).then((r) => r.data),
    initialData: useInitial ? initial.facets : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
