import "server-only";
import { Prisma, type ProgressStatus } from "@prisma/client";
import { badRequest, notFound } from "@/lib/api-response";
import {
  DURATION_RANGE,
  FORMAT_LABEL,
  FORMATS,
  LEVEL_LABEL,
  LEVELS,
  PRICING_LABEL,
  PRICINGS,
  RESOURCE_TYPES,
  TYPE_PLURAL,
  type Sort,
} from "@/lib/constants";
import { decodeCursor, encodeCursor, type Cursor } from "@/lib/cursor";
import { prisma } from "@/lib/prisma";
import type { ListQuery } from "@/lib/validations/learn";
import type {
  CategoryWithCount,
  Facets,
  Faq,
  ListMeta,
  ProviderWithCount,
  ResourceDetail,
  ResourceListItem,
  Viewer,
  ViewerProgress,
} from "@/types/learn";

export const listSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  coverUrl: true,
  type: true,
  level: true,
  pricing: true,
  priceUsd: true,
  format: true,
  durationMinutes: true,
  lessonCount: true,
  ratingAvg: true,
  ratingCount: true,
  saveCount: true,
  publishedAt: true,
  provider: { select: { slug: true, name: true, logoUrl: true, verified: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.ResourceSelect;

type ListRow = Prisma.ResourceGetPayload<{ select: typeof listSelect }>;

export function toListItem(row: ListRow): ResourceListItem {
  return {
    ...row,
    priceUsd: row.priceUsd === null ? null : Number(row.priceUsd),
    ratingAvg: Math.round(row.ratingAvg * 10) / 10,
    publishedAt: row.publishedAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ list */

type FilterKey = "type" | "category" | "level" | "pricing" | "format";

/** Prisma where for a list query. `omit` drops one filter, used for facet counts. */
function buildWhere(query: Partial<ListQuery>, omit?: FilterKey): Prisma.ResourceWhereInput {
  const and: Prisma.ResourceWhereInput[] = [{ status: "PUBLISHED" }];
  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" as const };
    and.push({
      OR: [{ title: contains }, { tagline: contains }, { provider: { name: contains } }, { tags: { some: { name: contains } } }],
    });
  }
  if (query.type && omit !== "type") and.push({ type: query.type });
  if (query.category?.length && omit !== "category") and.push({ category: { slug: { in: query.category } } });
  if (query.level?.length && omit !== "level") and.push({ level: { in: query.level } });
  if (query.pricing?.length && omit !== "pricing") and.push({ pricing: { in: query.pricing } });
  if (query.format?.length && omit !== "format") and.push({ format: { in: query.format } });
  if (query.duration) {
    const [min, max] = DURATION_RANGE[query.duration];
    and.push({ durationMinutes: max === null ? { gte: min } : { gte: min, lt: max } });
  }
  if (query.provider) and.push({ provider: { slug: query.provider } });
  return { AND: and };
}

const sortField: Record<Sort, { field: "trendingScore" | "publishedAt" | "ratingAvg" | "saveCount" | "durationMinutes"; dir: "asc" | "desc" }> = {
  trending: { field: "trendingScore", dir: "desc" },
  newest: { field: "publishedAt", dir: "desc" },
  rating: { field: "ratingAvg", dir: "desc" },
  saved: { field: "saveCount", dir: "desc" },
  shortest: { field: "durationMinutes", dir: "asc" },
};

function cursorWhere(sort: Sort, cursor: Cursor): Prisma.ResourceWhereInput {
  const { field, dir } = sortField[sort];
  const value = field === "publishedAt" ? new Date(String(cursor.v)) : Number(cursor.v);
  if (field === "publishedAt" && Number.isNaN((value as Date).getTime())) throw badRequest("The cursor is malformed.");
  const op = dir === "desc" ? "lt" : "gt";
  return {
    OR: [{ [field]: { [op]: value } }, { [field]: value, id: { [op]: cursor.id } }],
  };
}

export async function listResources(query: ListQuery): Promise<{ items: ResourceListItem[]; meta: ListMeta }> {
  const where = buildWhere(query);
  const { field, dir } = sortField[query.sort];
  let pageWhere = where;
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);
    if (!cursor) throw badRequest("The cursor is malformed.");
    pageWhere = { AND: [where, cursorWhere(query.sort, cursor)] };
  }

  const [rows, total] = await Promise.all([
    prisma.resource.findMany({
      where: pageWhere,
      orderBy: [{ [field]: dir }, { id: dir }],
      take: query.limit + 1,
      select: { ...listSelect, trendingScore: true },
    }),
    prisma.resource.count({ where }),
  ]);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ v: field === "publishedAt" ? last.publishedAt.toISOString() : last[field], id: last.id })
      : null;

  return { items: page.map(({ trendingScore: _score, ...row }) => toListItem(row)), meta: { total, nextCursor } };
}

export async function getFacets(query: Partial<ListQuery>): Promise<Facets> {
  const [types, categories, levels, pricings, formats, allCategories] = await Promise.all([
    prisma.resource.groupBy({ by: ["type"], where: buildWhere(query, "type"), _count: { _all: true } }),
    prisma.resource.groupBy({ by: ["categoryId"], where: buildWhere(query, "category"), _count: { _all: true } }),
    prisma.resource.groupBy({ by: ["level"], where: buildWhere(query, "level"), _count: { _all: true } }),
    prisma.resource.groupBy({ by: ["pricing"], where: buildWhere(query, "pricing"), _count: { _all: true } }),
    prisma.resource.groupBy({ by: ["format"], where: buildWhere(query, "format"), _count: { _all: true } }),
    prisma.category.findMany({ select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const countOf = <K extends string>(rows: ({ _count: { _all: number } } & Record<string, unknown>)[], key: string, value: K) =>
    rows.find((row) => row[key] === value)?._count._all ?? 0;

  return {
    type: RESOURCE_TYPES.map((value) => ({ value, label: TYPE_PLURAL[value], count: countOf(types, "type", value) })),
    category: allCategories.map((c) => ({ value: c.slug, label: c.name, count: countOf(categories, "categoryId", c.id) })),
    level: LEVELS.map((value) => ({ value, label: LEVEL_LABEL[value], count: countOf(levels, "level", value) })),
    pricing: PRICINGS.map((value) => ({ value, label: PRICING_LABEL[value], count: countOf(pricings, "pricing", value) })),
    format: FORMATS.map((value) => ({ value, label: FORMAT_LABEL[value], count: countOf(formats, "format", value) })),
  };
}

export async function getFeatured(): Promise<ResourceListItem[]> {
  const rows = await prisma.resource.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy: [{ trendingScore: "desc" }, { id: "desc" }],
    take: 4,
    select: listSelect,
  });
  return rows.map(toListItem);
}

export async function getStats(): Promise<{ total: number; lastUpdated: string | null }> {
  const [total, latest] = await Promise.all([
    prisma.resource.count({ where: { status: "PUBLISHED" } }),
    prisma.resource.findFirst({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  return { total, lastUpdated: latest?.updatedAt.toISOString() ?? null };
}

export async function listCategories(): Promise<CategoryWithCount[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      icon: true,
      _count: { select: { resources: { where: { status: "PUBLISHED" } } } },
    },
  });
  return rows.map(({ _count, ...row }) => ({ ...row, count: _count.resources }));
}

export async function getCategory(slug: string): Promise<CategoryWithCount | null> {
  const row = await prisma.category.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      icon: true,
      _count: { select: { resources: { where: { status: "PUBLISHED" } } } },
    },
  });
  if (!row) return null;
  const { _count, ...rest } = row;
  return { ...rest, count: _count.resources };
}

export async function listProviders(): Promise<ProviderWithCount[]> {
  const rows = await prisma.provider.findMany({
    where: { resources: { some: { status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      logoUrl: true,
      verified: true,
      _count: { select: { resources: { where: { status: "PUBLISHED" } } } },
    },
  });
  return rows.map(({ _count, ...row }) => ({ ...row, count: _count.resources }));
}

/** Title and provider matches for the search typeahead. */
export async function suggest(q: string) {
  const contains = { contains: q, mode: "insensitive" as const };
  const [resources, providers] = await Promise.all([
    prisma.resource.findMany({
      where: { status: "PUBLISHED", title: contains },
      orderBy: { trendingScore: "desc" },
      take: 6,
      select: { slug: true, title: true, type: true, provider: { select: { name: true, logoUrl: true } } },
    }),
    prisma.provider.findMany({
      where: { name: contains, resources: { some: { status: "PUBLISHED" } } },
      take: 3,
      select: { slug: true, name: true, logoUrl: true },
    }),
  ]);
  return { resources, providers };
}

/* ---------------------------------------------------------------- detail */

async function findPublished(slug: string) {
  const resource = await prisma.resource.findFirst({ where: { slug, status: "PUBLISHED" }, select: { id: true } });
  if (!resource) throw notFound("We couldn't find that resource. It may have been removed.");
  return resource;
}

function toProgress(row: { status: ProgressStatus; completedLessonIds: string[]; percent: number; updatedAt: Date } | null): ViewerProgress | null {
  return row ? { status: row.status, completedLessonIds: row.completedLessonIds, percent: row.percent, updatedAt: row.updatedAt.toISOString() } : null;
}

export async function getResourceDetail(slug: string): Promise<ResourceDetail | null> {
  const row = await prisma.resource.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      ...listSelect,
      description: true,
      externalUrl: true,
      language: true,
      hasCertificate: true,
      viewCount: true,
      updatedAt: true,
      learnOutcomes: true,
      prerequisites: true,
      toolsCovered: true,
      faqs: true,
      provider: { select: { slug: true, name: true, logoUrl: true, verified: true, websiteUrl: true, description: true } },
      author: { select: { slug: true, name: true, avatarUrl: true, bio: true, socialUrl: true } },
      tags: { select: { slug: true, name: true }, orderBy: { name: "asc" } },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, durationMinutes: true, isPreview: true } },
        },
      },
    },
  });
  if (!row) return null;

  const grouped = await prisma.review.groupBy({ by: ["rating"], where: { resourceId: row.id }, _count: { _all: true } });
  const ratingDistribution: ResourceDetail["ratingDistribution"] = [0, 0, 0, 0, 0];
  for (const g of grouped) if (g.rating >= 1 && g.rating <= 5) ratingDistribution[g.rating - 1] = g._count._all;

  const { updatedAt, faqs, provider, ...rest } = row;
  return {
    ...toListItem({ ...rest, provider }),
    ...rest,
    priceUsd: rest.priceUsd === null ? null : Number(rest.priceUsd),
    ratingAvg: Math.round(rest.ratingAvg * 10) / 10,
    publishedAt: rest.publishedAt.toISOString(),
    provider,
    updatedAt: updatedAt.toISOString(),
    faqs: Array.isArray(faqs) ? (faqs as Faq[]) : [],
    ratingDistribution,
  };
}

export async function getViewer(resourceId: string, userId: string | null): Promise<Viewer> {
  if (!userId) return { saved: false, progress: null, hasReviewed: false };
  const [saved, progress, review] = await Promise.all([
    prisma.savedResource.findUnique({ where: { userId_resourceId: { userId, resourceId } }, select: { userId: true } }),
    prisma.progress.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
      select: { status: true, completedLessonIds: true, percent: true, updatedAt: true },
    }),
    prisma.review.findUnique({ where: { resourceId_userId: { resourceId, userId } }, select: { id: true } }),
  ]);
  return { saved: Boolean(saved), progress: toProgress(progress), hasReviewed: Boolean(review) };
}

export function incrementViews(resourceId: string) {
  // Fire-and-forget: a failed counter must never break the page.
  void prisma.resource.update({ where: { id: resourceId }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
}

export async function getRelated(slug: string, limit = 4): Promise<ResourceListItem[]> {
  const base = await prisma.resource.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, categoryId: true, providerId: true, tags: { select: { id: true } } },
  });
  if (!base) throw notFound("We couldn't find that resource. It may have been removed.");

  const picked: ResourceListItem[] = [];
  const seen = new Set([base.id]);
  const tiers: Prisma.ResourceWhereInput[] = [
    { categoryId: base.categoryId },
    { providerId: base.providerId },
    { tags: { some: { id: { in: base.tags.map((t) => t.id) } } } },
    {},
  ];
  for (const tier of tiers) {
    if (picked.length >= limit) break;
    const rows = await prisma.resource.findMany({
      where: { ...tier, status: "PUBLISHED", id: { notIn: [...seen] } },
      orderBy: [{ ratingAvg: "desc" }, { id: "desc" }],
      take: limit - picked.length,
      select: listSelect,
    });
    for (const row of rows) {
      seen.add(row.id);
      picked.push(toListItem(row));
    }
  }
  return picked;
}

export { findPublished };
