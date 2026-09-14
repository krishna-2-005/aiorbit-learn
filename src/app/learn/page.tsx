import type { Metadata } from "next";
import { LearnExplorer } from "@/components/learn/learn-explorer";
import { loadListing } from "@/server/listing-data";

export const metadata: Metadata = {
  title: { absolute: "Learn AI — Courses, Guides & eBooks | AI Orbit" },
  description: "Browse AI courses, guides, eBooks, video tutorials and newsletters. Filter by topic, level, price and duration.",
  alternates: { canonical: "/learn" },
};

export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadListing(await searchParams);
  return (
    <LearnExplorer
      hero={{
        eyebrow: "Learn",
        title: "Learn AI — courses, guides & ebooks",
        subtitle: "Hand-picked courses, guides, eBooks, tutorials and newsletters from the teams building AI.",
        total: data.stats.total,
        lastUpdated: data.stats.lastUpdated,
      }}
      initial={data.initial}
      providers={data.providers}
      featured={data.featured}
    />
  );
}
