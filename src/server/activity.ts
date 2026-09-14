import "server-only";
import { Prisma } from "@prisma/client";
import { ApiError, badRequest, conflict, notFound } from "@/lib/api-response";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { prisma } from "@/lib/prisma";
import type { ProgressInput, ReviewInput, SubmitInput } from "@/lib/validations/learn";
import type { Library, LibraryItem, Review, ViewerProgress } from "@/types/learn";
import { findPublished, listSelect, toListItem } from "./learn";

/* --------------------------------------------------------------- reviews */

function displayName(name: string): string {
  const [first = "Learner", ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last[0]?.toUpperCase()}.` : first;
}

export async function listReviews(
  slug: string,
  { cursor, limit }: { cursor?: string; limit: number },
  viewerId: string | null,
): Promise<{ items: Review[]; nextCursor: string | null; viewerHasReviewed: boolean }> {
  const { id: resourceId } = await findPublished(slug);
  let where: Prisma.ReviewWhereInput = { resourceId };
  if (cursor) {
    const decoded = decodeCursor(cursor);
    const date = decoded ? new Date(String(decoded.v)) : null;
    if (!decoded || !date || Number.isNaN(date.getTime())) throw badRequest("The cursor is malformed.");
    where = { resourceId, OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: decoded.id } }] };
  }
  const [rows, own] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: { id: true, rating: true, title: true, body: true, createdAt: true, userId: true, user: { select: { name: true } } },
    }),
    viewerId ? prisma.review.findUnique({ where: { resourceId_userId: { resourceId, userId: viewerId } }, select: { id: true } }) : null,
  ]);
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: displayName(r.user.name),
      isOwn: r.userId === viewerId,
    })),
    nextCursor: hasMore && last ? encodeCursor({ v: last.createdAt.toISOString(), id: last.id }) : null,
    viewerHasReviewed: Boolean(own),
  };
}

export async function createReview(slug: string, user: { id: string; name: string }, input: ReviewInput) {
  const { id: resourceId } = await findPublished(slug);
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock the resource row so concurrent reviews recompute the average in turn.
      await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${resourceId} FOR UPDATE`;
      const review = await tx.review.create({
        data: { resourceId, userId: user.id, ...input },
        select: { id: true, rating: true, title: true, body: true, createdAt: true },
      });
      const agg = await tx.review.aggregate({ where: { resourceId }, _avg: { rating: true }, _count: { _all: true } });
      const ratingAvg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
      await tx.resource.update({ where: { id: resourceId }, data: { ratingAvg, ratingCount: agg._count._all } });
      return {
        review: { ...review, createdAt: review.createdAt.toISOString(), author: displayName(user.name), isOwn: true } satisfies Review,
        ratingAvg,
        ratingCount: agg._count._all,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("You've already reviewed this resource.");
    }
    throw error;
  }
}

/* ----------------------------------------------------------------- saves */

export async function setSaved(slug: string, userId: string, saved: boolean) {
  const { id: resourceId } = await findPublished(slug);
  return prisma.$transaction(async (tx) => {
    if (saved) {
      await tx.savedResource.upsert({
        where: { userId_resourceId: { userId, resourceId } },
        create: { userId, resourceId },
        update: {},
      });
    } else {
      await tx.savedResource.deleteMany({ where: { userId, resourceId } });
    }
    const saveCount = await tx.savedResource.count({ where: { resourceId } });
    await tx.resource.update({ where: { id: resourceId }, data: { saveCount } });
    return { saved, saveCount };
  });
}

export async function listSavedIds(userId: string): Promise<string[]> {
  const rows = await prisma.savedResource.findMany({ where: { userId }, select: { resource: { select: { slug: true } } } });
  return rows.map((r) => r.resource.slug);
}

/* -------------------------------------------------------------- progress */

export async function updateProgress(slug: string, userId: string, input: ProgressInput): Promise<ViewerProgress> {
  const resource = await prisma.resource.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, sections: { select: { lessons: { select: { id: true } } } } },
  });
  if (!resource) throw notFound("We couldn't find that resource. It may have been removed.");
  const lessonIds = resource.sections.flatMap((s) => s.lessons.map((l) => l.id));
  const resourceId = resource.id;

  const existing = await prisma.progress.findUnique({ where: { userId_resourceId: { userId, resourceId } } });
  let done = new Set(existing?.completedLessonIds ?? []);

  if ("lessonId" in input) {
    if (!lessonIds.includes(input.lessonId)) throw badRequest("That lesson isn't part of this resource.");
    if (input.done) done.add(input.lessonId);
    else done.delete(input.lessonId);
  } else if ("complete" in input) {
    done = new Set(lessonIds);
  }

  const completedLessonIds = lessonIds.filter((id) => done.has(id));
  const percent = lessonIds.length ? Math.round((completedLessonIds.length / lessonIds.length) * 100) : "complete" in input ? 100 : 0;
  const status = "complete" in input || percent === 100 ? "COMPLETED" : "STARTED";

  const row = await prisma.progress.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    create: { userId, resourceId, completedLessonIds, percent, status },
    update: { completedLessonIds, percent, status },
    select: { status: true, completedLessonIds: true, percent: true, updatedAt: true },
  });
  return { ...row, updatedAt: row.updatedAt.toISOString() };
}

export async function resetProgress(slug: string, userId: string) {
  const { id: resourceId } = await findPublished(slug);
  await prisma.progress.deleteMany({ where: { userId, resourceId } });
  return { removed: true };
}

/* --------------------------------------------------------------- library */

export async function getLibrary(userId: string): Promise<Library> {
  const [saved, progress] = await Promise.all([
    prisma.savedResource.findMany({
      where: { userId, resource: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, resource: { select: listSelect } },
    }),
    prisma.progress.findMany({
      where: { userId, resource: { status: "PUBLISHED" } },
      orderBy: { updatedAt: "desc" },
      select: { status: true, completedLessonIds: true, percent: true, updatedAt: true, resource: { select: listSelect } },
    }),
  ]);

  const progressById = new Map(
    progress.map((p) => [
      p.resource.id,
      { status: p.status, completedLessonIds: p.completedLessonIds, percent: p.percent, updatedAt: p.updatedAt.toISOString() },
    ]),
  );
  const savedAtById = new Map(saved.map((s) => [s.resource.id, s.createdAt.toISOString()]));
  const toItem = (row: Parameters<typeof toListItem>[0]): LibraryItem => ({
    ...toListItem(row),
    savedAt: savedAtById.get(row.id) ?? null,
    progress: progressById.get(row.id) ?? null,
  });

  return {
    saved: saved.map((s) => toItem(s.resource)),
    inProgress: progress.filter((p) => p.status === "STARTED").map((p) => toItem(p.resource)),
    completed: progress.filter((p) => p.status === "COMPLETED").map((p) => toItem(p.resource)),
  };
}

/* ---------------------------------------------------------------- submit */

const SUBMIT_LIMIT_PER_DAY = 5;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function submitResource(userId: string, input: SubmitInput) {
  // Counted in the database so the limit holds across serverless instances.
  const recent = await prisma.resource.count({
    where: { submittedById: userId, publishedAt: { gte: new Date(Date.now() - 86_400_000) } },
  });
  if (recent >= SUBMIT_LIMIT_PER_DAY) {
    throw new ApiError(429, "RATE_LIMITED", "You've submitted 5 resources today. Try again tomorrow.");
  }

  const category = await prisma.category.findUnique({ where: { slug: input.category }, select: { id: true } });
  if (!category) throw badRequest("Choose a category from the list.", [{ path: "category", message: "Choose a category from the list." }]);

  const providerSlug = slugify(input.provider) || "community";
  const provider = await prisma.provider.upsert({
    where: { slug: providerSlug },
    create: {
      slug: providerSlug,
      name: input.provider,
      logoUrl: `https://www.google.com/s2/favicons?domain=${new URL(input.url).hostname}&sz=128`,
      websiteUrl: new URL(input.url).origin,
      description: `${input.provider} learning resources.`,
    },
    update: {},
    select: { id: true },
  });

  const base = slugify(input.title) || "resource";
  const slug = `${base}-${Date.now().toString(36)}`;

  const created = await prisma.resource.create({
    data: {
      slug,
      title: input.title,
      tagline: input.description.slice(0, 90),
      description: input.description,
      coverUrl: input.coverUrl ?? `https://picsum.photos/seed/${base}/800/450`,
      externalUrl: input.url,
      type: input.type,
      level: input.level,
      pricing: input.pricing,
      format: input.type === "EBOOK" ? "PDF" : input.type === "TUTORIAL" ? "VIDEO" : "TEXT",
      durationMinutes: 0,
      lessonCount: 0,
      status: "PENDING",
      providerId: provider.id,
      categoryId: category.id,
      submittedById: userId,
    },
    select: { id: true, slug: true, status: true },
  });
  return created;
}
