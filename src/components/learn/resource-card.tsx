import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LEVEL_LABEL } from "@/lib/constants";
import { formatCompact, formatDuration, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ResourceListItem } from "@/types/learn";
import { Cover, PricingBadge, ProviderLogo, TypeBadge, VerifiedTick } from "./resource-meta";
import { SaveButton } from "./save-button";

type ResourceCardProps = {
  resource: ResourceListItem;
  priority?: boolean;
  /** Extra content under the cover, e.g. a progress bar in the library. */
  overlay?: ReactNode;
  headingLevel?: "h2" | "h3";
};

/** Grid card. The title link stretches over the card; the save button sits above it. */
export function ResourceCard({ resource: r, priority, overlay, headingLevel = "h3" }: ResourceCardProps) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-card transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-raised has-focus-visible:border-accent-fg">
      <div className="relative">
        <Cover
          src={r.coverUrl}
          alt=""
          sizes="(min-width: 1440px) 340px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="border-b border-border"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <TypeBadge type={r.type} className="absolute top-3 left-3 border-white/10 bg-black/70 backdrop-blur" />
        <PricingBadge pricing={r.pricing} className="absolute top-3 right-3 bg-black/70 backdrop-blur" />
        {overlay}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <ProviderLogo name={r.provider.name} logoUrl={r.provider.logoUrl} size={22} className="rounded-sm" />
          <span className="truncate text-xs font-medium text-fg-muted">{r.provider.name}</span>
          {r.provider.verified ? <VerifiedTick /> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Heading className="line-clamp-2 min-h-[2.5rem] text-[0.9375rem] leading-5 font-semibold text-fg">
            <Link href={`/learn/${r.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
              {r.title}
            </Link>
          </Heading>
          <p className="line-clamp-1 text-[0.8125rem] text-fg-muted">{r.tagline}</p>
        </div>

        <p className="flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
          <span>{LEVEL_LABEL[r.level]}</span>
          <Dot />
          <span>{formatDuration(r.durationMinutes)}</span>
          <Dot />
          <span>
            {r.lessonCount} {r.type === "NEWSLETTER" ? "issues" : r.lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <Rating value={r.ratingAvg} count={r.ratingCount} />
          <div className="flex items-center gap-2">
            <SaveButton slug={r.slug} title={r.title} />
            <span aria-hidden className="hidden items-center gap-1 text-xs font-semibold text-fg-muted transition-colors group-hover:text-fg sm:inline-flex">
              Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Dot() {
  return <span aria-hidden className="size-0.5 rounded-full bg-fg-subtle" />;
}

export function Rating({ value, count, className }: { value: number; count: number; className?: string }) {
  if (count === 0) return <span className={cn("text-xs text-fg-subtle", className)}>No reviews yet</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <Star aria-hidden className="size-3.5 fill-gold text-gold" />
      <span className="font-semibold text-fg">{formatRating(value)}</span>
      <span className="text-fg-subtle">
        ({formatCompact(count)}
        <span className="sr-only"> reviews</span>)
      </span>
    </span>
  );
}
