import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** AI Orbit page width: 1440px frame with 44px gutters on desktop, 16px on mobile. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:px-11", className)} {...props} />;
}
