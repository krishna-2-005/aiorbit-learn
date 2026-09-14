import { Check } from "lucide-react";
import type { ReactNode } from "react";

const valueLines = [
  "Save courses, guides and eBooks to your library",
  "Track lesson progress across everything you study",
  "Review resources and help others pick well",
];

/** Centered auth card on the black page with AI Orbit's faint hero glow. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="hero-glow flex min-h-[calc(100dvh-61px)] items-start justify-center px-4 py-12 md:items-center md:py-20">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-panel border border-border bg-card md:grid-cols-[1fr_1.1fr]">
        <aside className="hidden flex-col justify-between gap-10 border-r border-border bg-surface p-10 md:flex">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-accent-fg">AI Orbit Learn</p>
            <p className="text-3xl leading-tight font-black tracking-tight text-fg">Learn AI — courses, guides & ebooks.</p>
          </div>
          <ul className="flex flex-col gap-3">
            {valueLines.map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-fg-muted">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-green" />
                {line}
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex flex-col gap-8 p-6 sm:p-10">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-fg-muted">{subtitle}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
