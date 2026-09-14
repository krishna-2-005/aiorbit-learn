function trimDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0+$/, "");
}

/** Compact count: 950 -> "950", 1240 -> "1.2k", 1_500_000 -> "1.5M". */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${trimDecimal(value / 1_000_000)}M`;
  if (value >= 1000) return `${trimDecimal(value / 1000)}k`;
  return String(value);
}

/** Grouped count: 12345 -> "12,345". */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Minutes to a short duration: 45 -> "45m", 90 -> "1h 30m", 1260 -> "21h". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 10 || rest === 0) return `${Math.round(minutes / 60)}h`;
  return `${hours}h ${rest}m`;
}

/** "2026-03-12T…" -> "Mar 12, 2026". */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** Relative date for "updated" lines: "today", "3 days ago", "2 months ago". */
export function formatRelative(iso: string | Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/** Rating to one decimal: 4 -> "4.0". */
export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function formatPrice(pricing: "FREE" | "PAID" | "FREEMIUM", priceUsd: number | null): string {
  if (pricing === "FREE") return "Free";
  if (pricing === "FREEMIUM") return priceUsd ? `Free · $${trimDecimal(priceUsd, 2)} pro` : "Freemium";
  return priceUsd ? `$${trimDecimal(priceUsd, 2)}` : "Paid";
}
