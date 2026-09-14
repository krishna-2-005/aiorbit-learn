"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CloseButton } from "./dialog";
import { useModalDialog } from "./use-modal-dialog";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children?: ReactNode;
  /** Sticky action row, e.g. "Show 42 resources". */
  footer?: ReactNode;
  className?: string;
};

/** Bottom sheet for mobile (filters, menu). Same native-dialog behavior as Dialog. */
export function Drawer({ open, onOpenChange, title, children, footer, className }: DrawerProps) {
  const titleId = useId();
  const { ref, onBackdropClick } = useModalDialog(open, onOpenChange);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        "inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-panel border border-b-0 border-border bg-card p-0 text-fg shadow-float ",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            <CloseButton onClick={() => onOpenChange(false)} />
          </header>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
          {footer ? (
            <footer className="flex gap-2 border-t border-border px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
