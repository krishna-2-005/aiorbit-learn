import { notFound, ok, route } from "@/lib/api-response";
import { slugSchema } from "@/lib/validations/learn";
import { getRelated } from "@/server/learn";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(async (_request, { params }) => {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) throw notFound("We couldn't find that resource. It may have been removed.");
  return ok(await getRelated(slug));
});
