import { ok, parseWith, route } from "@/lib/api-response";
import { listQuerySchema, searchParamsToObject } from "@/lib/validations/learn";
import { listResources } from "@/server/learn";

export const GET = route(async (request) => {
  const query = parseWith(listQuerySchema, searchParamsToObject(request.nextUrl.searchParams));
  const { items, meta } = await listResources(query);
  return ok(items, meta);
});
