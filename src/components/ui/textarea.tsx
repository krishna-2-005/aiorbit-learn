"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, describedBy } from "./field";

type TextareaProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  containerClassName?: string;
};

export function Textarea({ label, hint, error, id, className, containerClassName, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <Field id={textareaId} label={label} hint={hint} error={error} className={containerClassName}>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        className={cn(controlClasses, "h-auto min-h-32 resize-y py-2.5 leading-relaxed", className)}
        {...props}
      />
    </Field>
  );
}
