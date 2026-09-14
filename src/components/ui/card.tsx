import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CardPadding = "none" | "md" | "lg";

const paddings: Record<CardPadding, string> = {
  none: "",
  md: "p-4 md:p-5",
  lg: "p-6 md:p-8",
};

type CardProps = ComponentProps<"div"> & { padding?: CardPadding };

/** Surface panel. Depth comes from the border and bg contrast, never a shadow. */
export function Card({ padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-card border border-border bg-card", paddings[padding], className)}
      {...props}
    />
  );
}
