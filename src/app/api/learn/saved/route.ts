import { ok, route } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { listSavedIds } from "@/server/activity";

/** Slugs of the current user's saved resources, for bookmark state on cards. */
export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listSavedIds(user.id));
});
