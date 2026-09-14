import { ok, route } from "@/lib/api-response";
import { listCategories } from "@/server/learn";

export const GET = route(async () => ok(await listCategories()));
