import { notFound, ok, route } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth";
import { slugSchema } from "@/lib/validations/learn";
import { getResourceDetail, getViewer, incrementViews } from "@/server/learn";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(async (_request, { params }) => {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) throw notFound("We couldn't find that resource. It may have been removed.");
  const resource = await getResourceDetail(slug);
  if (!resource) throw notFound("We couldn't find that resource. It may have been removed.");
  const user = await getSessionUser();
  incrementViews(resource.id);
  return ok(resource, { viewer: await getViewer(resource.id, user?.id ?? null) });
});
