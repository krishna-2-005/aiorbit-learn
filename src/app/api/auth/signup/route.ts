import { ok, parseWith, readJson, route } from "@/lib/api-response";
import { signupSchema } from "@/lib/validations/auth";
import { createUser } from "@/server/users";

export const POST = route(async (request) => {
  const input = parseWith(signupSchema, await readJson(request));
  const user = await createUser(input);
  return ok(user, undefined, { status: 201 });
});
