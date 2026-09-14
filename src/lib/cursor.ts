import { z } from "zod";

/**
 * Opaque keyset cursor: the sort value and id of the last row on the page.
 * The next page starts strictly after that (value, id) pair, so rows never
 * repeat or get skipped when new reviews shift ratings between requests.
 */
const cursorSchema = z.object({
  v: z.union([z.number(), z.string()]),
  id: z.string().min(1).max(64),
});

export type Cursor = z.infer<typeof cursorSchema>;

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** Returns null when the cursor is malformed so the caller can answer 400. */
export function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
