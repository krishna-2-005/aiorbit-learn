"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ResourceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        headingLevel="h1"
        icon={<TriangleAlert />}
        title="This resource couldn't load"
        description="We hit a problem loading the details. Try again, or head back to the library."
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/learn" variant="secondary">
              Back to Learn
            </ButtonLink>
          </>
        }
      />
    </Container>
  );
}
