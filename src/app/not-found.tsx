import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="py-16 md:py-24">
      <EmptyState
        headingLevel="h1"
        icon={<SearchX />}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={<ButtonLink href="/learn">Browse resources</ButtonLink>}
      />
    </Container>
  );
}
