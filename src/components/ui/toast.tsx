"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

/** App-wide toaster, bottom-right on desktop and top on mobile (clear of the sticky CTA bar). */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      mobileOffset={{ top: 72 }}
      visibleToasts={3}
      icons={{
        success: <CircleCheck className="size-5 text-green" aria-hidden />,
        error: <CircleAlert className="size-5 text-danger" aria-hidden />,
        info: <Info className="size-5 text-accent-fg" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-card border border-border bg-card px-4 py-3 text-fg shadow-float",
          title: "text-sm font-semibold",
          description: "text-[0.8125rem] text-fg-muted",
          icon: "mt-0.5",
          actionButton:
            "ml-auto h-8 shrink-0 rounded-full px-3 text-[0.8125rem] font-semibold text-accent-fg hover:bg-accent-soft",
        },
      }}
    />
  );
}
