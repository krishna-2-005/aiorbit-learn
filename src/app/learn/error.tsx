"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LearnError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        headingLevel="h1"
        icon={<TriangleAlert />}
        title="Learn couldn't load"
        description="Something went wrong while loading resources. Try again in a moment."
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/learn" variant="secondary">
              Reset filters
            </ButtonLink>
          </>
        }
      />
      {error.digest ? <p className="mt-4 text-center text-xs text-fg-subtle">Error reference: {error.digest}</p> : null}
    </Container>
  );
}
