"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, describedBy } from "./field";

export type SelectOption = { value: string; label: string };

type SelectProps = Omit<ComponentProps<"select">, "id" | "children"> & {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  options: SelectOption[];
  /** Adds an empty first option, e.g. "Any city". */
  placeholder?: string;
  id?: string;
  containerClassName?: string;
};

export function Select({
  label,
  hideLabel,
  hint,
  error,
  options,
  placeholder,
  id,
  className,
  containerClassName,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field
      id={selectId}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, hint, error)}
          className={cn(controlClasses, "appearance-none pr-10", className)}
          {...props}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4.5 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </Field>
  );
}
