import type { Format, Level, Pricing, ProgressStatus, ResourceType } from "@prisma/client";

export type ProviderSummary = { slug: string; name: string; logoUrl: string; verified: boolean };
export type CategorySummary = { slug: string; name: string };

export type ResourceListItem = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  coverUrl: string;
  type: ResourceType;
  level: Level;
  pricing: Pricing;
  priceUsd: number | null;
  format: Format;
  durationMinutes: number;
  lessonCount: number;
  ratingAvg: number;
  ratingCount: number;
  saveCount: number;
  publishedAt: string;
  provider: ProviderSummary;
  category: CategorySummary;
};

export type ListMeta = { total: number; nextCursor: string | null };

export type FacetCount = { value: string; label: string; count: number };

export type Facets = {
  type: FacetCount[];
  category: FacetCount[];
  level: FacetCount[];
  pricing: FacetCount[];
  format: FacetCount[];
};

export type Lesson = { id: string; title: string; durationMinutes: number; isPreview: boolean };
export type Section = { id: string; title: string; lessons: Lesson[] };
export type Faq = { question: string; answer: string };

export type ViewerProgress = { status: ProgressStatus; completedLessonIds: string[]; percent: number; updatedAt: string };

export type ResourceDetail = ResourceListItem & {
  description: string;
  externalUrl: string;
  language: string;
  hasCertificate: boolean;
  viewCount: number;
  updatedAt: string;
  learnOutcomes: string[];
  prerequisites: string[];
  toolsCovered: string[];
  faqs: Faq[];
  tags: { slug: string; name: string }[];
  sections: Section[];
  provider: ProviderSummary & { websiteUrl: string; description: string };
  author: { slug: string; name: string; avatarUrl: string; bio: string; socialUrl: string | null } | null;
  /** Counts for 1★..5★, index 0 = 1 star. */
  ratingDistribution: [number, number, number, number, number];
};

export type Viewer = {
  saved: boolean;
  progress: ViewerProgress | null;
  hasReviewed: boolean;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  author: string;
  isOwn: boolean;
};

export type LibraryItem = ResourceListItem & { savedAt: string | null; progress: ViewerProgress | null };

export type Library = {
  saved: LibraryItem[];
  inProgress: LibraryItem[];
  completed: LibraryItem[];
};

export type CategoryWithCount = { slug: string; name: string; description: string; icon: string; count: number };
export type ProviderWithCount = ProviderSummary & { count: number };
