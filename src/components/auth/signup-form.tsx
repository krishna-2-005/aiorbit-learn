"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { ApiResponse } from "@/lib/api-response";
import { fieldErrors } from "@/lib/form-errors";
import { signupSchema } from "@/lib/validations/auth";
import { PasswordInput } from "./password-input";

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  function update(field: keyof typeof values, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (submitted) {
      const result = signupSchema.safeParse(nextValues);
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    const result = signupSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = (await response.json()) as ApiResponse<{ id: string }>;
      if (!body.ok) {
        if (response.status === 409) setErrors({ email: body.error.message });
        else if (body.error.details) {
          setErrors(Object.fromEntries(body.error.details.map((issue) => [issue.path, issue.message])));
        } else setFormError(body.error.message);
        return;
      }
      const login = await signIn("credentials", {
        email: result.data.email,
        password: result.data.password,
        redirect: false,
      });
      if (!login || login.error) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      toast.success("Account created", { description: `Welcome, ${result.data.name.split(" ")[0]}.` });
      router.replace(next);
      router.refresh();
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const loginHref = next === "/learn" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <FormAlert>{formError}</FormAlert>
      ) : null}
      <Input
        label="Name"
        name="name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        value={values.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
      />
      <PasswordInput
        label="Password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        value={values.password}
        onChange={(event) => update("password", event.target.value)}
        error={errors.password}
      />
      <Button type="submit" loading={pending} loadingText="Creating account…" className="w-full">
        Create account
      </Button>
      <p className="text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-accent-fg hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
