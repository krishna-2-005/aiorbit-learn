"use client";

import { ArrowUpRight, CheckCircle2, CirclePlay, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { SaveButton } from "@/components/learn/save-button";
import { useProgress, useViewer } from "@/hooks/use-resource-activity";
import { TYPE_CTA } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ResourceDetail, Viewer } from "@/types/learn";
import { ProgressBar } from "./progress-bar";
import { ShareButton } from "./share-button";

type Props = { resource: ResourceDetail; initialViewer: Viewer };

function lessonIdsOf(resource: ResourceDetail) {
  return resource.sections.flatMap((s) => s.lessons.map((l) => l.id));
}

export function PrimaryCta({ resource, className }: { resource: ResourceDetail; className?: string }) {
  return (
    <a
      href={resource.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ variant: "white", size: "md", className: cn("h-10", className) })}
    >
      {TYPE_CTA[resource.type]}
      <ArrowUpRight aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Header action row: CTA, save, share. */
export function HeaderActions({ resource, initialViewer }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrimaryCta resource={resource} />
      <SaveButton slug={resource.slug} title={resource.title} variant="pill" initialSaved={initialViewer.saved} />
      <ShareButton title={resource.title} path={`/learn/${resource.slug}`} />
    </div>
  );
}

export function ProgressBadge({ resource, initialViewer }: Props) {
  const { data: viewer } = useViewer(resource.slug, initialViewer);
  if (!viewer.progress) return null;
  return viewer.progress.status === "COMPLETED" ? (
    <Badge tone="green" dot>
      Completed
    </Badge>
  ) : (
    <Badge tone="accent" dot>
      In progress · {viewer.progress.percent}%
    </Badge>
  );
}

/** Start / complete / reset controls, shown in the sidebar. */
export function ProgressPanel({ resource, initialViewer }: Props) {
  const { data: viewer } = useViewer(resource.slug, initialViewer);
  const progress = useProgress(resource.slug, lessonIdsOf(resource));
  const p = viewer.progress;

  if (!p) {
    return (
      <Button variant="secondary" className="w-full" icon={<CirclePlay aria-hidden />} onClick={() => progress.run({ start: true })} disabled={progress.pending}>
        Mark as started
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-control border border-border bg-surface p-3">
      <div className="flex items-center justify-between text-[0.8125rem]">
        <span className="font-semibold text-fg">{p.status === "COMPLETED" ? "Completed" : "In progress"}</span>
        <span className="text-fg-muted tabular-nums">{p.percent}%</span>
      </div>
      <ProgressBar percent={p.percent} label="Your progress" />
      <div className="flex gap-2">
        {p.status !== "COMPLETED" ? (
          <Button size="sm" variant="secondary" className="flex-1" icon={<CheckCircle2 aria-hidden />} onClick={() => progress.run({ complete: true })}>
            Mark complete
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" className={cn(p.status === "COMPLETED" && "flex-1")} icon={<RotateCcw aria-hidden />} onClick={() => progress.run("reset")}>
          Reset
        </Button>
      </div>
    </div>
  );
}

/** Bottom bar on phones so the main action is always in reach. */
export function MobileCtaBar({ resource, initialViewer }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-black/90 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <SaveButton slug={resource.slug} title={resource.title} initialSaved={initialViewer.saved} className="size-10 rounded-full" />
      <ShareButton title={resource.title} path={`/learn/${resource.slug}`} iconOnly />
      <PrimaryCta resource={resource} className="flex-1" />
    </div>
  );
}
