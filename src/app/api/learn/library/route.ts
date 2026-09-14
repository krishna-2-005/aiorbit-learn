import { ok, route } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getLibrary } from "@/server/activity";

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getLibrary(user.id));
});
