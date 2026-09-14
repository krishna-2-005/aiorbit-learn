import { notFound, ok, parseWith, readJson, route } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { progressSchema, slugSchema } from "@/lib/validations/learn";
import { resetProgress, updateProgress } from "@/server/activity";

type Ctx = { params: Promise<{ slug: string }> };

async function slugOf(params: Ctx["params"]) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) throw notFound("We couldn't find that resource. It may have been removed.");
  return slug;
}

export const PUT = route<Ctx>(async (request, { params }) => {
  const slug = await slugOf(params);
  const user = await requireUser();
  const input = parseWith(progressSchema, await readJson(request));
  return ok(await updateProgress(slug, user.id, input));
});

export const DELETE = route<Ctx>(async (_request, { params }) => {
  const slug = await slugOf(params);
  const user = await requireUser();
  return ok(await resetProgress(slug, user.id));
});
