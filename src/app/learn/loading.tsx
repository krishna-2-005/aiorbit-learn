import { Container } from "@/components/layout/container";
import { ResultsSkeleton } from "@/components/learn/listing-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <div role="status" aria-label="Loading resources">
      <section className="hero-glow border-b border-border-subtle">
        <Container className="flex flex-col items-center gap-5 pt-12 pb-10 md:pt-16 md:pb-12">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-10 w-full max-w-2xl sm:h-12" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-12 w-full max-w-[520px] md:h-[42px]" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[26px] w-20 rounded-full" />
            ))}
          </div>
        </Container>
      </section>
      <Container className="flex gap-3 overflow-hidden pt-7">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-32 shrink-0" />
        ))}
      </Container>
      <div className="mt-4 border-y border-border-subtle">
        <Container className="flex gap-2 overflow-hidden py-3">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </Container>
      </div>
      <Container className="pt-6">
        <Skeleton className="mb-6 h-5 w-32" />
        <ResultsSkeleton view="grid" />
      </Container>
    </div>
  );
}
