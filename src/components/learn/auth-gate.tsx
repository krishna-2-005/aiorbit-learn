import { Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function AuthGate({ title, description, next }: { title: string; description: string; next: string }) {
  const query = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="hero-glow mx-auto flex max-w-lg flex-col items-center gap-5 rounded-panel border border-border bg-card px-6 py-12 text-center animate-fade-in sm:px-10">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-fg-muted">
        <Lock aria-hidden className="size-5" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <ButtonLink href={`/login${query}`} variant="white">
          Log in
        </ButtonLink>
        <ButtonLink href={`/signup${query}`} variant="secondary">
          Create account
        </ButtonLink>
      </div>
      <p className="text-xs text-fg-subtle">
        Demo login: <span className="font-mono text-fg-muted">demo@aiorbit.dev</span> / <span className="font-mono text-fg-muted">password123</span>
      </p>
    </div>
  );
}
