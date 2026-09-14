import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { AuthGate } from "@/components/learn/auth-gate";
import { LibraryView } from "@/components/learn/library-view";
import { getSessionUser } from "@/lib/auth";
import { getLibrary } from "@/server/activity";

export const metadata: Metadata = { title: "My Library", robots: { index: false } };

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Container className="py-16 md:py-24">
        <AuthGate
          title="Sign in to build your library"
          description="Save courses, guides and eBooks, pick up where you left off and keep track of what you've finished."
          next="/learn/library"
        />
      </Container>
    );
  }

  const library = await getLibrary(user.id);
  return (
    <>
      <section className="hero-glow border-b border-border-subtle">
        <Container className="flex flex-col gap-2 pt-12 pb-8">
          <p className="eyebrow text-accent-fg">My Library</p>
          <h1 className="text-[2rem] leading-tight font-black tracking-[-0.025em] text-fg sm:text-[2.5rem]">
            {user.name ? `${user.name.split(" ")[0]}'s library` : "Your library"}
          </h1>
          <p className="text-[0.9375rem] text-fg-muted">Everything you&apos;ve saved, started and finished — in one place.</p>
        </Container>
      </section>
      <Container className="pt-6">
        <LibraryView initial={library} />
      </Container>
    </>
  );
}
