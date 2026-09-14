"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { fieldErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/validations/auth";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  function update(field: keyof typeof values, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    // Re-validate live only after the first submit, so errors don't shout while typing.
    if (submitted) {
      const result = loginSchema.safeParse(nextValues);
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const response = await signIn("credentials", { ...result.data, redirect: false });
      if (!response || response.error) {
        setFormError("That email and password don't match. Check them and try again, or create an account.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const signupHref = next === "/learn" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <FormAlert>{formError}</FormAlert>
      ) : null}
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
        autoComplete="current-password"
        value={values.password}
        onChange={(event) => update("password", event.target.value)}
        error={errors.password}
      />
      <Button type="submit" loading={pending} loadingText="Logging in…" className="w-full">
        Log in
      </Button>
      <p className="text-sm text-fg-muted">
        New to AI Orbit?{" "}
        <Link href={signupHref} className="font-medium text-accent-fg hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
