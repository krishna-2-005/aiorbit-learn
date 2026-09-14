import { Container } from "@/components/layout/container";
import { CardSkeleton } from "@/components/learn/listing-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourceLoading() {
  return (
    <Container role="status" aria-label="Loading resource" className="flex flex-col gap-6 pt-6">
      <Skeleton className="h-3 w-56" />
      <div className="grid gap-8 rounded-panel border border-border bg-card p-5 sm:p-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-card" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="aspect-video w-full rounded-card" />
      </div>
      <div className="flex gap-6 border-b border-border-subtle py-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-6 h-40 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-card" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
