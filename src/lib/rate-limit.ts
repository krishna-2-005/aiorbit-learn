import { ApiError } from "@/lib/api-response";

/**
 * In-memory sliding-window limiter. Good enough for one server instance; on
 * serverless each instance has its own memory, so the real limit is per instance.
 * Upgrade path: the same interface backed by Upstash Redis (@upstash/ratelimit).
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - recent[0]!)) / 1000);
    hits.set(key, recent);
    return { ok: false as const, retryAfterSeconds };
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound.
  if (hits.size > 10_000) {
    for (const [storedKey, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(storedKey);
    }
  }
  return { ok: true as const, retryAfterSeconds: 0 };
}

export function enforceRateLimit(key: string, options: { limit: number; windowMs: number }, message: string) {
  const result = rateLimit(key, options);
  if (!result.ok) {
    throw new ApiError(429, "RATE_LIMITED", `${message} Try again in ${result.retryAfterSeconds} seconds.`);
  }
}
