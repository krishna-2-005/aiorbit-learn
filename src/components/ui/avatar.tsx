import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { box: "size-7 text-xs", px: 28 },
  md: { box: "size-9 text-sm", px: 36 },
  lg: { box: "size-12 text-base", px: 48 },
};

/** Round image or initials. Used for providers, authors and reviewers. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-soft font-semibold text-accent-fg",
        s.box,
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={name} width={s.px} height={s.px} className="size-full object-cover" />
      ) : (
        <span aria-label={name} role="img">
          <span aria-hidden>{initials(name)}</span>
        </span>
      )}
    </span>
  );
}
