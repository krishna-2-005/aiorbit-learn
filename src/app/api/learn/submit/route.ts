import { ok, parseWith, readJson, route } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { submitSchema } from "@/lib/validations/learn";
import { submitResource } from "@/server/activity";

export const POST = route(async (request) => {
  const user = await requireUser();
  const input = parseWith(submitSchema, await readJson(request));
  return ok(await submitResource(user.id, input), undefined, { status: 201 });
});
