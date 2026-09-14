"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type NavSection = { id: string; label: string };

/** Sticky in-page navigation; an IntersectionObserver marks the section under the bar. */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = sections.find((section) => visible.get(section.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-130px 0px -55% 0px" },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections" className="sticky top-[61px] z-20 border-b border-border-subtle bg-black/85 backdrop-blur-md">
      <ul className="flex gap-6 overflow-x-auto scrollbar-none">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={() => setActive(section.id)}
              aria-current={active === section.id ? "location" : undefined}
              className={cn(
                "-mb-px flex h-12 items-center border-b-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors",
                active === section.id ? "border-white text-fg" : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
