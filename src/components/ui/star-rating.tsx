"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";
import { formatCount, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  count?: number;
  /** "reviews" renders "(318 reviews)" instead of "(318)". */
  countLabel?: "short" | "reviews";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const displaySizes = {
  sm: { text: "text-sm", icon: "size-4" },
  md: { text: "text-[0.9375rem]", icon: "size-4.5" },
  lg: { text: "text-lg", icon: "size-5" },
};

/** Compact rating: ★ 4.3 (212). Gold is used for stars only. */
export function StarRating({ value, count, countLabel = "short", size = "md", className }: StarRatingProps) {
  const s = displaySizes[size];
  const countText =
    count === undefined ? null
    : countLabel === "reviews" ? `(${formatCount(count)} ${count === 1 ? "review" : "reviews"})`
    : `(${formatCount(count)})`;

  return (
    <span
      className={cn("inline-flex items-center gap-1", s.text, className)}
      aria-label={`Rated ${formatRating(value)} out of 5${count !== undefined ? ` from ${formatCount(count)} reviews` : ""}`}
      role="img"
    >
      <Star aria-hidden className={cn(s.icon, "fill-gold text-gold")} />
      <span className="font-semibold text-fg">{formatRating(value)}</span>
      {countText ? <span className="text-fg-muted">{countText}</span> : null}
    </span>
  );
}

/** Five stars for a single review's whole-number rating. */
export function StarRow({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`Rated ${value} out of 5`} className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          strokeWidth={1.5}
          className={cn("size-4", star <= value ? "fill-gold text-gold" : "text-fg-muted/50")}
        />
      ))}
    </span>
  );
}

type StarRatingInputProps = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  error?: string;
  name?: string;
};

const ratingWords = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

/** Five native radios styled as stars: arrow keys and screen readers work natively. */
export function StarRatingInput({ label, value, onValueChange, error, name }: StarRatingInputProps) {
  const id = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset
      className="flex flex-col gap-1.5"
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 text-sm font-medium text-fg">{label}</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="flex size-10 items-center justify-center rounded-control has-focus-visible:outline-2 has-focus-visible:outline-accent-fg"
              onPointerEnter={() => setHover(star)}
            >
              <input
                type="radio"
                name={name ?? id}
                value={star}
                checked={value === star}
                onChange={() => onValueChange(star)}
                className="sr-only"
              />
              <span className="sr-only">
                {star} {star === 1 ? "star" : "stars"}, {ratingWords[star]}
              </span>
              <Star
                aria-hidden
                className={cn("size-7", star <= shown ? "fill-gold text-gold" : "text-fg-muted/60")}
                strokeWidth={1.5}
              />
            </label>
          ))}
        </div>
        <span className="text-sm text-fg-muted" aria-hidden>
          {shown ? ratingWords[shown] : "Select a rating"}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
