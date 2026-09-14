import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { LEVEL_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import type { ResourceListItem } from "@/types/learn";
import { Dot, Rating } from "./resource-card";
import { Cover, PricingBadge, TypeBadge, VerifiedTick } from "./resource-meta";
import { SaveButton } from "./save-button";

/** List view row, modelled on AI Orbit's directory table rows. */
export function ResourceRow({ resource: r, priority }: { resource: ResourceListItem; priority?: boolean }) {
  return (
    <li className="group relative flex items-center gap-4 border-b border-border-subtle px-3 py-3 transition-colors last:border-b-0 hover:bg-raised has-focus-visible:bg-raised sm:px-4">
      <Cover
        subject={r}
        alt=""
        sizes="160px"
        compact
        priority={priority}
        className="w-24 shrink-0 rounded-control border border-border sm:w-40"
        imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-fg-muted">
          <span className="truncate">{r.provider.name}</span>
          {r.provider.verified ? <VerifiedTick /> : null}
        </div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg sm:text-[0.9375rem]">
          <Link href={`/learn/${r.slug}`} className="line-clamp-1 outline-none after:absolute after:inset-0 after:content-['']">
            {r.title}
          </Link>
          <ArrowUpRight aria-hidden className="hidden size-3.5 shrink-0 text-fg-subtle group-hover:text-fg-muted sm:block" />
        </h3>
        <p className="hidden line-clamp-1 text-[0.8125rem] text-fg-muted sm:block">{r.tagline}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
          <TypeBadge type={r.type} className="h-5 px-2" />
          <span className="hidden sm:inline">{LEVEL_LABEL[r.level]}</span>
          <span className="hidden sm:inline-flex"><Dot /></span>
          <span>{formatDuration(r.durationMinutes)}</span>
          <Rating value={r.ratingAvg} count={r.ratingCount} className="sm:hidden" />
        </div>
      </div>

      <div className="hidden w-28 shrink-0 md:block">
        <PricingBadge pricing={r.pricing} />
      </div>
      <div className="hidden w-28 shrink-0 sm:block">
        <Rating value={r.ratingAvg} count={r.ratingCount} />
      </div>
      <SaveButton slug={r.slug} title={r.title} className="shrink-0" />
    </li>
  );
}
