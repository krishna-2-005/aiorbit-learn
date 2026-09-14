import type { Pricing, ResourceType } from "@prisma/client";
import { BadgeCheck, BookOpen, FileText, GraduationCap, Mail, PlayCircle } from "lucide-react";
import Image from "next/image";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PRICING_LABEL, TYPE_LABEL } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

export const TYPE_ICON: Record<ResourceType, typeof BookOpen> = {
  COURSE: GraduationCap,
  GUIDE: BookOpen,
  EBOOK: FileText,
  TUTORIAL: PlayCircle,
  NEWSLETTER: Mail,
};

const PRICING_TONE: Record<Pricing, BadgeTone> = { FREE: "green", FREEMIUM: "sky", PAID: "gold" };

export function PricingBadge({ pricing, className }: { pricing: Pricing; className?: string }) {
  return (
    <Badge tone={PRICING_TONE[pricing]} dot className={className}>
      {PRICING_LABEL[pricing]}
    </Badge>
  );
}

export function TypeBadge({ type, className }: { type: ResourceType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return (
    <Badge tone="neutral" className={cn("gap-1 text-fg-soft", className)}>
      <Icon aria-hidden className="size-3" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

/** Square logo tile like AI Orbit's directory rows: white rounded tile, logo inside. */
export function ProviderLogo({ name, logoUrl, size = 40, className }: { name: string; logoUrl: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-border bg-white", className)}
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="absolute text-[0.625rem] font-bold text-black/40">
        {initials(name)}
      </span>
      <Image
        src={logoUrl}
        alt=""
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        unoptimized
        className="relative"
        loading="lazy"
      />
    </span>
  );
}

export function VerifiedTick({ className }: { className?: string }) {
  return (
    <BadgeCheck role="img" aria-label="Verified provider" className={cn("size-3.5 shrink-0 fill-sky/20 text-sky", className)} />
  );
}

/** 16:9 cover with a gradient placeholder that shows until (or instead of) the image. */
export function Cover({
  src,
  alt,
  sizes,
  priority,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,var(--accent-soft),transparent_60%),linear-gradient(135deg,var(--surface-raised),var(--surface))]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imageClassName)} />
      ) : null}
    </div>
  );
}
