import { Container } from "@/components/layout/container";
import { CardSkeleton, GRID_CLASSES } from "@/components/learn/listing-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div role="status" aria-label="Loading your library">
      <section className="border-b border-border-subtle">
        <Container className="flex flex-col gap-3 pt-12 pb-8">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </Container>
      </section>
      <Container className="flex flex-col gap-6 pt-6">
        <div className="flex gap-6 border-b border-border pb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className={GRID_CLASSES}>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}
