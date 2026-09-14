import { z } from "zod";
import { ok, parseWith, route } from "@/lib/api-response";
import { suggest } from "@/server/learn";

const schema = z.object({ q: z.string().trim().min(1, "Type something to search.").max(100) });

export const GET = route(async (request) => {
  const { q } = parseWith(schema, { q: request.nextUrl.searchParams.get("q") ?? "" });
  return ok(await suggest(q));
});
