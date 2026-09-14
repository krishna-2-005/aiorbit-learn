"use client";

import { MessageSquarePlus, Star } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { StarRatingInput, StarRow } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useCreateReview, useReviews, useViewer } from "@/hooks/use-resource-activity";
import { fieldErrors } from "@/lib/form-errors";
import { formatCount, formatDate, formatRating } from "@/lib/format";
import { reviewSchema, type ReviewInput } from "@/lib/validations/learn";
import { cn } from "@/lib/utils";
import type { Review, Viewer } from "@/types/learn";

type ReviewsSectionProps = {
  slug: string;
  title: string;
  ratingAvg: number;
  ratingCount: number;
  distribution: [number, number, number, number, number];
  initialReviews: { data: Review[]; meta: { nextCursor: string | null; viewerHasReviewed: boolean } };
  initialViewer: Viewer;
};

type Draft = { rating: number; title: string; body: string };
const emptyDraft: Draft = { rating: 0, title: "", body: "" };

export function ReviewsSection({ slug, title, ratingAvg, ratingCount, distribution, initialReviews, initialViewer }: ReviewsSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const reviews = useReviews(slug, initialReviews);
  const { data: viewer } = useViewer(slug, initialViewer);
  const create = useCreateReview(slug, session?.user?.name ? `${session.user.name.split(" ")[0]}` : "You");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ avg: ratingAvg, count: ratingCount, distribution });

  const items = reviews.data.pages.flatMap((p) => p.data);
  const hasReviewed = viewer.hasReviewed || reviews.data.pages[0]?.meta.viewerHasReviewed;

  function openForm() {
    if (status !== "authenticated") {
      toast.info("Log in to write a review", {
        action: { label: "Log in", onClick: () => router.push(`/login?next=${encodeURIComponent(`${pathname}#reviews`)}`) },
      });
      return;
    }
    setFormError(null);
    setOpen(true);
  }

  function submit(input: ReviewInput) {
    setOpen(false);
    create.mutate(input, {
      onSuccess: (created) => {
        setDraft(emptyDraft);
        setCounts((c) => {
          const next = c.distribution.map((n, i) => (i === input.rating - 1 ? n + 1 : n)) as typeof distribution;
          return { avg: created.ratingAvg, count: created.ratingCount, distribution: next };
        });
        toast.success("Review published", { description: "Thanks for helping other learners." });
      },
      onError: (error) => {
        setFormError(error.message);
        setOpen(true);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 rounded-card border border-border bg-card p-5 sm:grid-cols-[180px_1fr] sm:p-6">
        <div className="flex flex-col items-start gap-1.5 sm:border-r sm:border-border-subtle sm:pr-6">
          <span className="text-5xl font-black tracking-tight text-fg tabular-nums">{counts.count ? formatRating(counts.avg) : "—"}</span>
          <StarRow value={Math.round(counts.avg)} />
          <span className="text-xs text-fg-muted">
            {formatCount(counts.count)} {counts.count === 1 ? "review" : "reviews"}
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4">
          <RatingDistribution distribution={counts.distribution} total={counts.count} />
          <div className="flex flex-wrap items-center gap-3">
            {hasReviewed ? (
              <p className="text-[0.8125rem] text-fg-muted">You&apos;ve reviewed this resource. Thanks!</p>
            ) : (
              <Button variant="white" size="sm" icon={<MessageSquarePlus aria-hidden />} onClick={openForm} loading={create.isPending} loadingText="Publishing…">
                Write a review
              </Button>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Star />} title="No reviews yet" description="Be the first to share how useful this resource was." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((review) => (
            <li
              key={review.id}
              className={cn(
                "flex flex-col gap-3 rounded-card border border-border bg-card p-5 animate-fade-in",
                review.id.startsWith("pending-") && "opacity-70",
                review.isOwn && "border-accent/40",
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar name={review.author} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[0.8125rem] font-semibold text-fg">
                    {review.author}
                    {review.isOwn ? <span className="ml-2 text-xs font-medium text-accent-fg">Your review</span> : null}
                  </span>
                  <span className="text-xs text-fg-subtle">{review.id.startsWith("pending-") ? "Publishing…" : formatDate(review.createdAt)}</span>
                </div>
                <StarRow value={review.rating} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-fg">{review.title}</h3>
                <p className="text-[0.8125rem] leading-relaxed text-fg-muted">{review.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reviews.hasNextPage ? (
        <Button variant="secondary" className="self-center" loading={reviews.isFetchingNextPage} loadingText="Loading…" onClick={() => void reviews.fetchNextPage()}>
          Show more reviews
        </Button>
      ) : null}

      <ReviewFormDialog open={open} onOpenChange={setOpen} title={title} draft={draft} onDraftChange={setDraft} formError={formError} onSubmit={submit} />
    </div>
  );
}

export function RatingDistribution({ distribution, total }: { distribution: number[]; total: number }) {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Rating distribution">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star - 1] ?? 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <li key={star} className="flex items-center gap-3 text-xs">
            <span className="flex w-6 items-center gap-0.5 text-fg-muted tabular-nums">
              {star}
              <Star aria-hidden className="size-3 fill-gold text-gold" />
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
              <span className="block h-full rounded-full bg-gold/80" style={{ width: `${pct}%` }} />
            </span>
            <span className="w-9 text-right text-fg-subtle tabular-nums">
              {pct}%<span className="sr-only"> ({count} reviews)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ReviewFormDialog({
  open,
  onOpenChange,
  title,
  draft,
  onDraftChange,
  formError,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  formError: string | null;
  onSubmit: (input: ReviewInput) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    onDraftChange(next);
    if (submitted) {
      const result = reviewSchema.safeParse(next);
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const result = reviewSchema.safeParse(draft);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  const bodyLength = draft.body.trim().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Write a review" description={`How useful was “${title}”?`}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <StarRatingInput label="Your rating" value={draft.rating} onValueChange={(rating) => update({ rating })} error={errors.rating} />
        <Input
          label="Title"
          placeholder="Clear explanations, great projects"
          value={draft.title}
          maxLength={80}
          onChange={(event) => update({ title: event.target.value })}
          error={errors.title}
        />
        <Textarea
          label="Your review"
          placeholder="What did you learn? Who is it for? Anything missing?"
          value={draft.body}
          maxLength={2000}
          rows={5}
          onChange={(event) => update({ body: event.target.value })}
          error={errors.body}
          hint={bodyLength < 20 ? `At least 20 characters (${bodyLength}/20).` : `${bodyLength}/2,000 characters.`}
        />
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Publish review</Button>
        </div>
      </form>
    </Dialog>
  );
}
