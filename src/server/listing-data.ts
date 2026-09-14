import "server-only";
import { filtersToSearch, learnSearchCache } from "@/lib/learn-filters";
import { listQuerySchema } from "@/lib/validations/learn";
import { getFacets, getFeatured, getStats, listProviders, listResources } from "./learn";

type RawParams = Record<string, string | string[] | undefined>;

/** Everything the listing needs for its first paint, keyed by the same query string the client uses. */
export async function loadListing(raw: RawParams, lockedCategory?: string) {
  const filters = learnSearchCache.parse(raw);
  const search = filtersToSearch(filters, lockedCategory);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(search)));
  const query = parsed.success ? parsed.data : listQuerySchema.parse({});

  const [list, facets, stats, featured, providers] = await Promise.all([
    listResources(query),
    getFacets(query),
    getStats(),
    lockedCategory ? Promise.resolve([]) : getFeatured(),
    listProviders(),
  ]);

  return {
    initial: { search, page: { data: list.items, meta: list.meta }, facets },
    stats,
    featured,
    providers,
  };
}
