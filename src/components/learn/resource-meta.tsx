import type { Pricing, ResourceType } from "@prisma/client";
import {
  BadgeCheck,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  ChartLine,
  Code,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  Megaphone,
  MessageSquareText,
  Palette,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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

type CoverSubject = { coverUrl: string; type: ResourceType; category: { slug: string; name: string } };

const CATEGORY_ART: Record<string, { icon: typeof BookOpen; tint: string; glow: string }> = {
  llms: { icon: Brain, tint: "text-violet border-violet/30", glow: "from-violet/25" },
  "prompt-engineering": { icon: MessageSquareText, tint: "text-sky border-sky/30", glow: "from-sky/20" },
  agents: { icon: Bot, tint: "text-orange border-orange/30", glow: "from-orange/20" },
  "image-video": { icon: ImageIcon, tint: "text-gold border-gold/30", glow: "from-gold/20" },
  coding: { icon: Code, tint: "text-green border-green/30", glow: "from-green/20" },
  "data-science": { icon: ChartLine, tint: "text-sky border-sky/30", glow: "from-sky/20" },
  "business-productivity": { icon: Briefcase, tint: "text-gold border-gold/30", glow: "from-gold/20" },
  marketing: { icon: Megaphone, tint: "text-orange border-orange/30", glow: "from-orange/20" },
  design: { icon: Palette, tint: "text-violet border-violet/30", glow: "from-violet/25" },
  "ethics-safety": { icon: ShieldCheck, tint: "text-green border-green/30", glow: "from-green/20" },
};

const FALLBACK_ART = { icon: Sparkles, tint: "text-accent-fg border-accent/30", glow: "from-accent/25" };

/** Placeholder photos add noise; seeded covers render as on-brand "orbit" art instead. */
function isPlaceholder(url: string) {
  return !url || url.includes("picsum.photos");
}

/** 16:9 cover: the resource image, or generated art tinted by category. */
export function Cover({
  subject,
  alt,
  sizes,
  priority,
  compact,
  className,
  imageClassName,
}: {
  subject: CoverSubject;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Small thumbnails (list rows) drop the rings and label. */
  compact?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const art = CATEGORY_ART[subject.category.slug] ?? FALLBACK_ART;
  const Icon = art.icon;
  const TypeIcon = TYPE_ICON[subject.type];

  return (
    <div className={cn("relative isolate aspect-video overflow-hidden bg-surface", className)}>
      {isPlaceholder(subject.coverUrl) ? (
        <div role={alt ? "img" : undefined} aria-label={alt || undefined} className={cn("absolute inset-0", imageClassName)}>
          <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-br via-transparent to-transparent", art.glow)} />
          <div
            aria-hidden
            className="absolute inset-0 opacity-40 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
          />
          {!compact ? (
            <>
              <span aria-hidden className={cn("absolute top-1/2 left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-40 [aspect-ratio:1]", art.tint)} style={{ height: "auto" }} />
              <span aria-hidden className={cn("absolute top-1/2 left-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-60 [aspect-ratio:1]", art.tint)} style={{ height: "auto" }} />
            </>
          ) : null}
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card",
              compact ? "size-9" : "size-14",
              art.tint,
            )}
          >
            <Icon className={compact ? "size-4" : "size-6"} />
          </span>
          {!compact ? (
            <span aria-hidden className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-[0.625rem] font-bold tracking-[0.12em] text-fg-muted uppercase">
              <span className="truncate">{subject.category.name}</span>
              <TypeIcon className="size-3.5 shrink-0" />
            </span>
          ) : null}
        </div>
      ) : (
        <Image src={subject.coverUrl} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imageClassName)} />
      )}
    </div>
  );
}
