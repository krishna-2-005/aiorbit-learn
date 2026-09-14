import { Skeleton } from "@/components/ui/skeleton";
import type { View } from "@/lib/constants";

export const GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4";

export function CardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-card border border-border bg-card">
      <Skeleton className="aspect-video rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-[22px] rounded-sm" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-0.5 h-3.5 w-full" />
        </div>
        <Skeleton className="h-3 w-40" />
        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <li aria-hidden className="flex items-center gap-4 border-b border-border-subtle px-3 py-3 last:border-b-0 sm:px-4">
      <Skeleton className="aspect-video w-24 shrink-0 sm:w-40" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="hidden h-3.5 w-4/5 sm:block" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="hidden h-6 w-20 md:block" />
      <Skeleton className="hidden h-4 w-16 sm:block" />
      <Skeleton className="size-8" />
    </li>
  );
}

export function ResultsSkeleton({ view, count = 12 }: { view: View; count?: number }) {
  if (view === "list") {
    return (
      <ul className="overflow-hidden rounded-card border border-border bg-card">
        {Array.from({ length: count }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </ul>
    );
  }
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
