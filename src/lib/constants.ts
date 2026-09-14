import type { Format, Level, Pricing, ResourceType } from "@prisma/client";

export const RESOURCE_TYPES = ["COURSE", "GUIDE", "EBOOK", "TUTORIAL", "NEWSLETTER"] as const satisfies readonly ResourceType[];
export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const satisfies readonly Level[];
export const PRICINGS = ["FREE", "PAID", "FREEMIUM"] as const satisfies readonly Pricing[];
export const FORMATS = ["VIDEO", "TEXT", "INTERACTIVE", "PDF"] as const satisfies readonly Format[];
export const DURATIONS = ["lt1", "1to5", "5to20", "gt20"] as const;
export const SORTS = ["trending", "newest", "rating", "saved", "shortest"] as const;
export const VIEWS = ["grid", "list"] as const;

export type Duration = (typeof DURATIONS)[number];
export type Sort = (typeof SORTS)[number];
export type View = (typeof VIEWS)[number];

/** URL value (lowercase plural) <-> enum, e.g. ?type=courses. */
export const TYPE_TABS: { value: string; type: ResourceType | null; label: string }[] = [
  { value: "all", type: null, label: "All" },
  { value: "courses", type: "COURSE", label: "Courses" },
  { value: "guides", type: "GUIDE", label: "Guides" },
  { value: "ebooks", type: "EBOOK", label: "eBooks" },
  { value: "tutorials", type: "TUTORIAL", label: "Tutorials" },
  { value: "newsletters", type: "NEWSLETTER", label: "Newsletters" },
];

export const TYPE_LABEL: Record<ResourceType, string> = {
  COURSE: "Course",
  GUIDE: "Guide",
  EBOOK: "eBook",
  TUTORIAL: "Tutorial",
  NEWSLETTER: "Newsletter",
};

export const TYPE_PLURAL: Record<ResourceType, string> = {
  COURSE: "Courses",
  GUIDE: "Guides",
  EBOOK: "eBooks",
  TUTORIAL: "Tutorials",
  NEWSLETTER: "Newsletters",
};

export const TYPE_CTA: Record<ResourceType, string> = {
  COURSE: "Start course",
  GUIDE: "Read guide",
  EBOOK: "Download eBook",
  TUTORIAL: "Watch tutorial",
  NEWSLETTER: "Subscribe",
};

export const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const PRICING_LABEL: Record<Pricing, string> = {
  FREE: "Free",
  PAID: "Paid",
  FREEMIUM: "Freemium",
};

export const FORMAT_LABEL: Record<Format, string> = {
  VIDEO: "Video",
  TEXT: "Text",
  INTERACTIVE: "Interactive",
  PDF: "PDF",
};

export const DURATION_LABEL: Record<Duration, string> = {
  lt1: "< 1h",
  "1to5": "1–5h",
  "5to20": "5–20h",
  gt20: "20h+",
};

/** Minute bounds per duration bucket: [min inclusive, max exclusive). */
export const DURATION_RANGE: Record<Duration, [number, number | null]> = {
  lt1: [0, 60],
  "1to5": [60, 300],
  "5to20": [300, 1200],
  gt20: [1200, null],
};

export const SORT_LABEL: Record<Sort, string> = {
  trending: "Trending",
  newest: "Newest",
  rating: "Top rated",
  saved: "Most saved",
  shortest: "Shortest",
};

export const PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 24;
