"use client";

import { Check } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "id"> & {
  label: string;
  description?: string;
  id?: string;
};

export function Checkbox({ label, description, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-10 items-start gap-3 py-2 has-disabled:cursor-not-allowed has-disabled:opacity-60",
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          aria-describedby={description ? `${inputId}-description` : undefined}
          className="peer size-5 appearance-none rounded-[4px] border border-border-strong bg-card checked:border-accent checked:bg-accent hover:border-border-strong disabled:cursor-not-allowed"
          {...props}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0.5 size-4 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="flex flex-col">
        <span className="text-[0.9375rem] text-fg">{label}</span>
        {description ? (
          <span id={`${inputId}-description`} className="text-sm text-fg-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
