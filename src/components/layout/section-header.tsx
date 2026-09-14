import Link from "next/link";

/** Section title with a rule running to an optional "see all" link. */
export function SectionHeader({
  title,
  href,
  linkLabel,
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <h2 id={id} className="text-lg font-semibold tracking-tight md:text-xl">
        {title}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
      {href && linkLabel ? (
        <Link href={href} className="inline-flex min-h-10 items-center text-sm font-medium text-fg-muted hover:text-fg">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
