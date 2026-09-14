import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Create an account" subtitle="Save resources, track progress and write reviews.">
      <SignupForm next={safeNext(next)} />
    </AuthShell>
  );
}
