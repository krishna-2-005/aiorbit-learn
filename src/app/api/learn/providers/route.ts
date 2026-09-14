import { ok, route } from "@/lib/api-response";
import { listProviders } from "@/server/learn";

export const GET = route(async () => ok(await listProviders()));
