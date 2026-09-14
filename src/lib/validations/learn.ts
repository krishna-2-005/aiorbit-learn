import { z } from "zod";
import { DURATIONS, FORMATS, LEVELS, MAX_PAGE_SIZE, PAGE_SIZE, PRICINGS, RESOURCE_TYPES, SORTS, TYPE_TABS } from "@/lib/constants";

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug.");

/** Accepts ?x=a,b and repeated ?x=a&x=b; empty values are dropped. */
function list<T extends string>(values: readonly [T, ...T[]]) {
  return z
    .preprocess((raw) => {
      if (raw === undefined || raw === null || raw === "") return undefined;
      const items = (Array.isArray(raw) ? raw : [raw]).flatMap((value) => String(value).split(","));
      const clean = items.map((value) => value.trim()).filter(Boolean);
      return clean.length ? clean : undefined;
    }, z.array(z.enum(values)).max(values.length).optional())
    .transform((value) => (value ? [...new Set(value)] : undefined));
}

const typeValues = TYPE_TABS.map((tab) => tab.value) as [string, ...string[]];

export const listQuerySchema = z.object({
  q: z.string().trim().max(100, "Keep the search under 100 characters.").optional().transform((v) => v || undefined),
  // Accepts the URL tab value ("courses") or the enum ("COURSE").
  type: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value || value === "all") return undefined;
      const tab = TYPE_TABS.find((t) => t.value === value.toLowerCase());
      if (tab?.type) return tab.type;
      const upper = value.toUpperCase();
      if ((RESOURCE_TYPES as readonly string[]).includes(upper)) return upper as (typeof RESOURCE_TYPES)[number];
      ctx.addIssue({ code: "custom", message: `Type must be one of: ${typeValues.join(", ")}.` });
      return z.NEVER;
    }),
  category: z
    .preprocess((raw) => {
      if (raw === undefined || raw === "") return undefined;
      return (Array.isArray(raw) ? raw : [raw]).flatMap((v) => String(v).split(",")).filter(Boolean);
    }, z.array(slugSchema).max(10).optional()),
  level: list(LEVELS),
  pricing: list(PRICINGS),
  format: list(FORMATS),
  duration: z.enum(DURATIONS, { error: `Duration must be one of: ${DURATIONS.join(", ")}.` }).optional(),
  provider: slugSchema.optional(),
  sort: z.enum(SORTS, { error: `Sort must be one of: ${SORTS.join(", ")}.` }).default("trending"),
  cursor: z.string().max(400).optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number." })
    .int("Limit must be a whole number.")
    .min(1, "Limit must be at least 1.")
    .transform((value) => Math.min(value, MAX_PAGE_SIZE))
    .default(PAGE_SIZE),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Reads URLSearchParams into a plain object, keeping repeated keys as arrays. */
export function searchParamsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key.replace(/\[\]$/, "")).concat(key.endsWith("[]") ? params.getAll(key) : []);
    const name = key.replace(/\[\]$/, "");
    out[name] = values.length > 1 ? values : (values[0] ?? "");
  }
  return out;
}

export const reviewSchema = z.object({
  rating: z.coerce.number({ error: "Pick a rating." }).int().min(1, "Pick a rating from 1 to 5.").max(5, "Pick a rating from 1 to 5."),
  title: z.string({ error: "Add a title." }).trim().min(3, "Use at least 3 characters.").max(80, "Keep the title under 80 characters."),
  body: z.string({ error: "Write your review." }).trim().min(20, "Write at least 20 characters.").max(2000, "Keep it under 2,000 characters."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const reviewListQuerySchema = z.object({
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const progressSchema = z.union([
  z.object({ lessonId: z.string().min(1).max(64), done: z.boolean() }),
  z.object({ complete: z.literal(true) }),
  z.object({ start: z.literal(true) }),
]);

export type ProgressInput = z.infer<typeof progressSchema>;

export const submitSchema = z.object({
  title: z.string({ error: "Add a title." }).trim().min(6, "Use at least 6 characters.").max(120, "Keep it under 120 characters."),
  url: z.string({ error: "Add the link." }).trim().pipe(z.url({ protocol: /^https?$/, error: "Enter a full link, like https://example.com/course." })),
  type: z.enum(RESOURCE_TYPES, { error: "Choose a type." }),
  category: slugSchema.or(z.literal("")).refine((value) => value !== "", "Choose a category."),
  level: z.enum(LEVELS, { error: "Choose a level." }),
  pricing: z.enum(PRICINGS, { error: "Choose a price." }),
  description: z
    .string({ error: "Describe the resource." })
    .trim()
    .min(80, "Write at least 80 characters so reviewers know what it covers.")
    .max(2000, "Keep it under 2,000 characters."),
  provider: z.string({ error: "Add the provider." }).trim().min(2, "Add the provider or author.").max(80),
  coverUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.url({ protocol: /^https$/, error: "Use an https image link, or leave it empty." }).optional()),
});

export type SubmitInput = z.infer<typeof submitSchema>;
