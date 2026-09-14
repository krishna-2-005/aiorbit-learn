"use client";

import { CircleCheckBig } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { LEVEL_LABEL, LEVELS, PRICING_LABEL, PRICINGS, RESOURCE_TYPES, TYPE_LABEL } from "@/lib/constants";
import { fieldErrors } from "@/lib/form-errors";
import { submitSchema } from "@/lib/validations/learn";

type Values = {
  title: string;
  url: string;
  type: string;
  category: string;
  level: string;
  pricing: string;
  description: string;
  provider: string;
  coverUrl: string;
};

const empty: Values = { title: "", url: "", type: "", category: "", level: "", pricing: "", description: "", provider: "", coverUrl: "" };

export function SubmitForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function update(field: keyof Values, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) {
      const result = submitSchema.safeParse(next);
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    const result = submitSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      const first = result.error.issues[0]?.path[0];
      if (first) document.querySelector<HTMLElement>(`[name="${String(first)}"]`)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await apiFetch<{ slug: string }>("/api/learn/submit", { method: "POST", json: result.data });
      setDone(result.data.title);
      toast.success("Submission received", { description: "We'll review it within 48 hours." });
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (error instanceof ApiClientError && error.details?.length) {
        setErrors(Object.fromEntries(error.details.map((issue) => [issue.path, issue.message])));
      } else {
        setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-5 rounded-panel border border-border bg-card px-6 py-14 text-center animate-fade-in">
        <span className="flex size-14 items-center justify-center rounded-full border border-green/30 bg-green/10 text-green">
          <CircleCheckBig aria-hidden className="size-6" />
        </span>
        <div className="flex max-w-md flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-fg">Thanks — under review</h2>
          <p className="text-sm text-fg-muted">
            “{done}” is in the review queue. Our editors check every submission, usually within 48 hours, before it appears in Learn.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/learn" variant="white">
            Back to Learn
          </ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              setValues(empty);
              setSubmitted(false);
              setDone(null);
            }}
          >
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  const descriptionLength = values.description.trim().length;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-panel border border-border bg-card p-5 sm:p-8">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Title" name="title" placeholder="Practical Prompt Engineering" value={values.title} onChange={(e) => update("title", e.target.value)} error={errors.title} containerClassName="sm:col-span-2" />
        <Input label="Link" name="url" type="url" inputMode="url" placeholder="https://example.com/course" value={values.url} onChange={(e) => update("url", e.target.value)} error={errors.url} />
        <Input label="Provider or author" name="provider" placeholder="DeepLearning.AI" value={values.provider} onChange={(e) => update("provider", e.target.value)} error={errors.provider} />
        <Select label="Type" name="type" placeholder="Choose a type" options={RESOURCE_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} value={values.type} onChange={(e) => update("type", e.target.value)} error={errors.type} />
        <Select label="Category" name="category" placeholder="Choose a category" options={categories.map((c) => ({ value: c.slug, label: c.name }))} value={values.category} onChange={(e) => update("category", e.target.value)} error={errors.category} />
        <Select label="Level" name="level" placeholder="Choose a level" options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] }))} value={values.level} onChange={(e) => update("level", e.target.value)} error={errors.level} />
        <Select label="Price" name="pricing" placeholder="Choose a price" options={PRICINGS.map((p) => ({ value: p, label: PRICING_LABEL[p] }))} value={values.pricing} onChange={(e) => update("pricing", e.target.value)} error={errors.pricing} />
        <Textarea
          label="Description"
          name="description"
          rows={6}
          placeholder="What does it cover, who is it for, and what will someone be able to do after?"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          error={errors.description}
          hint={descriptionLength < 80 ? `At least 80 characters (${descriptionLength}/80).` : `${descriptionLength}/2,000 characters.`}
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Cover image link (optional)"
          name="coverUrl"
          type="url"
          inputMode="url"
          placeholder="https://example.com/cover.jpg"
          hint="16:9 works best. Leave empty and we'll generate one."
          value={values.coverUrl}
          onChange={(e) => update("coverUrl", e.target.value)}
          error={errors.coverUrl}
          containerClassName="sm:col-span-2"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-fg-subtle">Submissions are reviewed before they go live. Up to 5 per day.</p>
        <Button type="submit" size="lg" loading={pending} loadingText="Submitting…">
          Submit for review
        </Button>
      </div>
    </form>
  );
}
