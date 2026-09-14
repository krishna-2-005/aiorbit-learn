import {
  Award,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  MonitorPlay,
  Signal,
  Bookmark,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Curriculum } from "@/components/learn/detail/curriculum";
import { HeaderActions, MobileCtaBar, PrimaryCta, ProgressBadge, ProgressPanel } from "@/components/learn/detail/resource-actions";
import { ReviewsSection } from "@/components/learn/detail/reviews-section";
import { SectionNav } from "@/components/learn/detail/section-nav";
import { Rating } from "@/components/learn/resource-card";
import { ResourceCard } from "@/components/learn/resource-card";
import { Cover, PricingBadge, ProviderLogo, TypeBadge, VerifiedTick } from "@/components/learn/resource-meta";
import { SaveButton } from "@/components/learn/save-button";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth";
import { FORMAT_LABEL, LEVEL_LABEL, TYPE_LABEL, TYPE_PLURAL, TYPE_TABS } from "@/lib/constants";
import { formatCompact, formatDate, formatDuration, formatPrice, formatRelative } from "@/lib/format";
import { appUrl } from "@/lib/site";
import { slugSchema } from "@/lib/validations/learn";
import { listReviews } from "@/server/activity";
import { getRelated, getResourceDetail, getViewer, incrementViews } from "@/server/learn";

type Props = { params: Promise<{ slug: string }> };

const LANGUAGES: Record<string, string> = { en: "English", es: "Spanish", hi: "Hindi", fr: "French", de: "German" };

const loadResource = cache(async (slug: string) => {
  if (!slugSchema.safeParse(slug).success) return null;
  return getResourceDetail(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = await loadResource((await params).slug);
  if (!resource) return { title: "Resource not found" };
  const title = `${resource.title} — ${TYPE_LABEL[resource.type]} by ${resource.provider.name}`;
  return {
    title,
    description: resource.tagline,
    alternates: { canonical: `/learn/${resource.slug}` },
    openGraph: { title, description: resource.tagline, type: "article", images: [{ url: resource.coverUrl, width: 800, height: 450 }] },
    twitter: { card: "summary_large_image", title, description: resource.tagline, images: [resource.coverUrl] },
  };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = await loadResource(slug);
  if (!resource) notFound();

  const user = await getSessionUser();
  const [viewer, related, reviews] = await Promise.all([
    getViewer(resource.id, user?.id ?? null),
    getRelated(resource.slug),
    listReviews(resource.slug, { limit: 6 }, user?.id ?? null),
  ]);
  incrementViews(resource.id);

  const unit = resource.type === "NEWSLETTER" ? "issue" : "lesson";
  const typeTab = TYPE_TABS.find((t) => t.type === resource.type)?.value ?? "all";
  const sections = [
    { id: "overview", label: "Overview" },
    { id: "outcomes", label: "What you'll learn" },
    { id: "curriculum", label: resource.type === "NEWSLETTER" ? "Issues" : "Curriculum" },
    ...(resource.author ? [{ id: "instructor", label: resource.type === "COURSE" || resource.type === "TUTORIAL" ? "Instructor" : "Author" }] : []),
    { id: "reviews", label: "Reviews" },
    ...(resource.faqs.length ? [{ id: "faq", label: "FAQ" }] : []),
    { id: "related", label: "Related" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": resource.type === "COURSE" ? "Course" : resource.type === "EBOOK" ? "Book" : "LearningResource",
    name: resource.title,
    description: resource.tagline,
    url: `${appUrl}/learn/${resource.slug}`,
    image: resource.coverUrl,
    inLanguage: resource.language,
    educationalLevel: LEVEL_LABEL[resource.level],
    provider: { "@type": "Organization", name: resource.provider.name, sameAs: resource.provider.websiteUrl },
    ...(resource.ratingCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: resource.ratingAvg, reviewCount: resource.ratingCount, bestRating: 5 } }
      : {}),
    offers: { "@type": "Offer", category: resource.pricing === "FREE" ? "Free" : "Paid", price: resource.priceUsd ?? 0, priceCurrency: "USD" },
  };

  return (
    <div className="pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Container className="flex flex-col gap-6 pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
            <li>
              <Link href="/learn" className="hover:text-fg">
                Learn
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3 text-fg-subtle" />
            <li>
              <Link href={`/learn?type=${typeTab}`} className="hover:text-fg">
                {TYPE_PLURAL[resource.type]}
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3 text-fg-subtle" />
            <li aria-current="page" className="max-w-[40ch] truncate text-fg-soft">
              {resource.title}
            </li>
          </ol>
        </nav>

        {/* Header panel */}
        <header className="relative overflow-hidden rounded-panel border border-border bg-card">
          <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
          <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <ProviderLogo name={resource.provider.name} logoUrl={resource.provider.logoUrl} size={64} className="rounded-card" />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-fg-soft">
                    {resource.provider.name}
                    {resource.provider.verified ? <VerifiedTick className="size-4" /> : null}
                  </span>
                  <span className="text-xs text-fg-subtle">Updated {formatRelative(resource.updatedAt)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="text-[1.75rem] leading-tight font-black tracking-[-0.02em] text-fg sm:text-[2.25rem]">{resource.title}</h1>
                <p className="max-w-2xl text-[0.9375rem] text-fg-muted">{resource.tagline}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={resource.type} />
                <Badge tone="neutral">{LEVEL_LABEL[resource.level]}</Badge>
                <PricingBadge pricing={resource.pricing} />
                <ProgressBadge resource={resource} initialViewer={viewer} />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-fg-muted">
                <Rating value={resource.ratingAvg} count={resource.ratingCount} className="text-[0.8125rem]" />
                <span className="inline-flex items-center gap-1.5">
                  <Bookmark aria-hidden className="size-3.5" /> {formatCompact(resource.saveCount)} saves
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye aria-hidden className="size-3.5" /> {formatCompact(resource.viewCount)} views
                </span>
              </div>
              <div className="hidden lg:block">
                <HeaderActions resource={resource} initialViewer={viewer} />
              </div>
            </div>
            <Cover
              subject={resource}
              alt={`Cover for ${resource.title}`}
              sizes="(min-width: 1024px) 420px, 100vw"
              priority
              className="rounded-card border border-border"
            />
            <div className="lg:hidden">
              <HeaderActions resource={resource} initialViewer={viewer} />
            </div>
          </div>
        </header>

        <SectionNav sections={sections} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          {/* Main column */}
          <div className="flex min-w-0 flex-col gap-12">
            <Block id="overview" title="Overview">
              <div className="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-soft">
                {resource.description.split(/\n\n+/).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              {resource.tags.length ? (
                <ul aria-label="Tags" className="mt-5 flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <li key={tag.slug}>
                      <Link
                        href={`/learn?q=${encodeURIComponent(tag.name)}`}
                        className="inline-flex h-7 items-center rounded-full border border-border bg-surface px-3 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      >
                        #{tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Block>

            <Block id="outcomes" title="What you'll learn">
              <ul className="grid gap-3 rounded-card border border-border bg-card p-5 sm:grid-cols-2">
                {resource.learnOutcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2.5 text-sm text-fg-soft">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-green" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </Block>

            <Block id="curriculum" title={resource.type === "NEWSLETTER" ? "Recent issues" : "Curriculum"}>
              <Curriculum slug={resource.slug} sections={resource.sections} initialViewer={viewer} unit={unit} />
            </Block>

            {resource.prerequisites.length || resource.toolsCovered.length ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {resource.prerequisites.length ? (
                  <Block title="Prerequisites" small>
                    <ul className="flex flex-col gap-2">
                      {resource.prerequisites.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-fg-soft">
                          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Block>
                ) : null}
                {resource.toolsCovered.length ? (
                  <Block title="Tools covered" small>
                    <ul className="flex flex-wrap gap-2">
                      {resource.toolsCovered.map((tool) => (
                        <li key={tool}>
                          <a
                            href={`https://aiorbit.club/tools/${tool}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[0.8125rem] font-medium text-fg-soft capitalize transition-colors hover:border-border-strong hover:text-fg"
                          >
                            {tool.replace(/-/g, " ")}
                            <ExternalLink aria-hidden className="size-3 text-fg-subtle" />
                            <span className="sr-only">(opens AI Orbit in a new tab)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Block>
                ) : null}
              </div>
            ) : null}

            {resource.author ? (
              <Block id="instructor" title={resource.type === "COURSE" || resource.type === "TUTORIAL" ? "Instructor" : "Author"}>
                <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5 sm:flex-row sm:items-start">
                  <Image src={resource.author.avatarUrl} alt="" width={64} height={64} unoptimized className="size-16 rounded-full border border-border object-cover" />
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold text-fg">{resource.author.name}</h3>
                    <p className="text-xs text-fg-subtle">
                      {resource.type === "COURSE" || resource.type === "TUTORIAL" ? "Instructor" : "Author"} at {resource.provider.name}
                    </p>
                    <p className="text-sm leading-relaxed text-fg-muted">{resource.author.bio}</p>
                    {resource.author.socialUrl ? (
                      <a href={resource.author.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex w-fit items-center gap-1 text-[0.8125rem] font-semibold text-accent-fg hover:underline">
                        Profile <ExternalLink aria-hidden className="size-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Block>
            ) : null}

            <Block id="reviews" title="Reviews">
              <ReviewsSection
                slug={resource.slug}
                title={resource.title}
                ratingAvg={resource.ratingAvg}
                ratingCount={resource.ratingCount}
                distribution={resource.ratingDistribution}
                initialReviews={{ data: reviews.items, meta: { nextCursor: reviews.nextCursor, viewerHasReviewed: reviews.viewerHasReviewed } }}
                initialViewer={viewer}
              />
            </Block>

            {resource.faqs.length ? (
              <Block id="faq" title="FAQ">
                <div className="overflow-hidden rounded-card border border-border bg-card">
                  {resource.faqs.map((faq) => (
                    <details key={faq.question} className="group border-b border-border-subtle last:border-b-0">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-fg transition-colors hover:bg-raised [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="px-5 pb-4 text-sm leading-relaxed text-fg-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </Block>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside aria-label="Resource details" className="flex flex-col gap-4 lg:sticky lg:top-[125px] lg:self-start">
            <div className="flex flex-col gap-5 rounded-card border border-border bg-card p-5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black tracking-tight text-fg">{formatPrice(resource.pricing, resource.priceUsd)}</span>
                <PricingBadge pricing={resource.pricing} />
              </div>
              <PrimaryCta resource={resource} className="w-full" />
              <div className="grid grid-cols-1 gap-2">
                <SaveButton slug={resource.slug} title={resource.title} variant="pill" initialSaved={viewer.saved} className="w-full" />
                <ProgressPanel resource={resource} initialViewer={viewer} />
              </div>
              <dl className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle text-[0.8125rem]">
                <Fact
                  icon={<Clock />}
                  label={unit === "issue" ? "Read time" : "Duration"}
                  value={unit === "issue" ? `${resource.durationMinutes} min per issue` : formatDuration(resource.durationMinutes)}
                />
                <Fact icon={<Layers />} label={unit === "issue" ? "Issues" : "Lessons"} value={String(resource.lessonCount)} />
                <Fact icon={<Signal />} label="Level" value={LEVEL_LABEL[resource.level]} />
                <Fact icon={<MonitorPlay />} label="Format" value={FORMAT_LABEL[resource.format]} />
                <Fact icon={<Globe />} label="Language" value={LANGUAGES[resource.language] ?? resource.language.toUpperCase()} />
                <Fact icon={<Award />} label="Certificate" value={resource.hasCertificate ? "Yes" : "No"} />
                <Fact icon={<CalendarClock />} label="Last updated" value={formatDate(resource.updatedAt)} />
              </dl>
              <p className="text-xs text-fg-subtle">
                Category:{" "}
                <Link href={`/learn/category/${resource.category.slug}`} className="font-semibold text-fg-muted hover:text-fg">
                  {resource.category.name}
                </Link>
              </p>
            </div>
          </aside>
        </div>

        {related.length ? (
          <section id="related" aria-labelledby="related-heading" className="mt-6 flex scroll-mt-32 flex-col gap-5">
            <div className="flex items-center gap-3">
              <h2 id="related-heading" className="eyebrow text-fg">
                Related resources
              </h2>
              <span aria-hidden className="h-px flex-1 bg-border-subtle" />
              <Link href={`/learn/category/${resource.category.slug}`} className="text-xs font-semibold text-fg-muted hover:text-fg">
                More in {resource.category.name} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <MobileCtaBar resource={resource} initialViewer={viewer} />
    </div>
  );
}

function Block({ id, title, small, children }: { id?: string; title: string; small?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="flex scroll-mt-32 flex-col gap-4">
      <h2 id={id ? `${id}-heading` : undefined} className={small ? "eyebrow text-fg-muted" : "text-xl font-bold tracking-tight text-fg"}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="flex items-center gap-2 text-fg-muted [&>svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-fg">{value}</dd>
    </div>
  );
}
