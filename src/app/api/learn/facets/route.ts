import { ok, parseWith, route } from "@/lib/api-response";
import { listQuerySchema, searchParamsToObject } from "@/lib/validations/learn";
import { getFacets } from "@/server/learn";

export const GET = route(async (request) => {
  const query = parseWith(listQuerySchema, searchParamsToObject(request.nextUrl.searchParams));
  return ok(await getFacets(query));
});
