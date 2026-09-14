import { notFound, ok, route } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { slugSchema } from "@/lib/validations/learn";
import { setSaved } from "@/server/activity";

type Ctx = { params: Promise<{ slug: string }> };

function handler(saved: boolean) {
  return route<Ctx>(async (_request, { params }) => {
    const { slug } = await params;
    const user = await requireUser();
    if (!slugSchema.safeParse(slug).success) throw notFound("We couldn't find that resource. It may have been removed.");
    return ok(await setSaved(slug, user.id, saved));
  });
}

export const PUT = handler(true);
export const DELETE = handler(false);
