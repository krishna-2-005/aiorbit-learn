import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnExplorer } from "@/components/learn/learn-explorer";
import { slugSchema } from "@/lib/validations/learn";
import { getCategory } from "@/server/learn";
import { loadListing } from "@/server/listing-data";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function categoryFor(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  return getCategory(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await categoryFor((await params).slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `Learn ${category.name} — courses, guides & eBooks`,
    description: category.description,
    alternates: { canonical: `/learn/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await categoryFor((await params).slug);
  if (!category) notFound();
  const data = await loadListing(await searchParams, category.slug);
  return (
    <LearnExplorer
      hero={{
        eyebrow: `Learn · ${category.name}`,
        title: `${category.name} courses, guides & ebooks`,
        subtitle: category.description,
        total: category.count,
        lastUpdated: data.stats.lastUpdated,
      }}
      initial={data.initial}
      providers={data.providers}
      featured={[]}
      lockedCategory={category.slug}
    />
  );
}
