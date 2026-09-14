import { SearchX } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ResourceNotFound() {
  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        headingLevel="h1"
        icon={<SearchX />}
        title="Resource not found"
        description="This course, guide or eBook doesn't exist or may have been removed. Browse the library for something similar."
        action={
          <>
            <ButtonLink href="/learn">Browse resources</ButtonLink>
            <ButtonLink href="/learn/library" variant="secondary">
              My Library
            </ButtonLink>
          </>
        }
      />
    </Container>
  );
}
