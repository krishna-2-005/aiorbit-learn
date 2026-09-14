"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, describedBy } from "./field";

type InputProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  /** Icon shown inside the field on the left. */
  icon?: ReactNode;
  /** Element shown inside the field on the right, e.g. a "Show" toggle. */
  trailing?: ReactNode;
  id?: string;
  containerClassName?: string;
};

export function Input({
  label,
  hideLabel,
  hint,
  error,
  icon,
  trailing,
  id,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      id={inputId}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-muted [&>svg]:size-4.5">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          className={cn(controlClasses, icon ? "pl-10" : null, trailing ? "pr-20" : null, className)}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>
        ) : null}
      </div>
    </Field>
  );
}
