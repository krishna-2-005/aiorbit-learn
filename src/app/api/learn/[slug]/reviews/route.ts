import { notFound, ok, parseWith, readJson, route } from "@/lib/api-response";
import { getSessionUser, requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reviewListQuerySchema, reviewSchema, slugSchema } from "@/lib/validations/learn";
import { createReview, listReviews } from "@/server/activity";

type Ctx = { params: Promise<{ slug: string }> };

async function slugOf(params: Ctx["params"]) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) throw notFound("We couldn't find that resource. It may have been removed.");
  return slug;
}

export const GET = route<Ctx>(async (request, { params }) => {
  const slug = await slugOf(params);
  const query = parseWith(reviewListQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
  const user = await getSessionUser();
  const { items, nextCursor, viewerHasReviewed } = await listReviews(slug, query, user?.id ?? null);
  return ok(items, { nextCursor, viewerHasReviewed });
});

export const POST = route<Ctx>(async (request, { params }) => {
  const slug = await slugOf(params);
  const user = await requireUser();
  enforceRateLimit(`review:${user.id}`, { limit: 10, windowMs: 60_000 }, "You're posting reviews too quickly.");
  const input = parseWith(reviewSchema, await readJson(request));
  return ok(await createReview(slug, user, input), undefined, { status: 201 });
});
