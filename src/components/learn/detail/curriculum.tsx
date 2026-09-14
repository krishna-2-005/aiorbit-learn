"use client";

import { Check, ChevronDown, Lock, PlayCircle } from "lucide-react";
import { useState } from "react";
import { useProgress, useViewer } from "@/hooks/use-resource-activity";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lesson, Section, Viewer } from "@/types/learn";
import { ProgressBar } from "./progress-bar";

type CurriculumProps = {
  slug: string;
  sections: Section[];
  initialViewer: Viewer;
  unit: "lesson" | "issue";
};

/** Accordion of sections → lessons. With progress, lessons become checkboxes. */
export function Curriculum({ slug, sections, initialViewer, unit }: CurriculumProps) {
  const { data: viewer } = useViewer(slug, initialViewer);
  const lessonIds = sections.flatMap((s) => s.lessons.map((l) => l.id));
  const progress = useProgress(slug, lessonIds);
  const tracking = Boolean(viewer.progress);
  const done = new Set(viewer.progress?.completedLessonIds ?? []);
  const [open, setOpen] = useState<Set<string>>(() => new Set(sections[0] ? [sections[0].id] : []));
  const allOpen = open.size === sections.length;
  const totalMinutes = sections.reduce((sum, s) => sum + s.lessons.reduce((m, l) => m + l.durationMinutes, 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-fg-muted">
        <p>
          {sections.length} sections · {lessonIds.length} {unit}s · {formatDuration(totalMinutes)} total
        </p>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}
          className="font-semibold text-fg-soft hover:text-fg"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {tracking && viewer.progress ? (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-[0.8125rem]">
            <span className="font-semibold text-fg">Your progress</span>
            <span className="text-fg-muted tabular-nums">
              {viewer.progress.completedLessonIds.length}/{lessonIds.length} · {viewer.progress.percent}%
            </span>
          </div>
          <ProgressBar percent={viewer.progress.percent} label="Course progress" />
        </div>
      ) : null}

      <ul className="overflow-hidden rounded-card border border-border bg-card">
        {sections.map((section, index) => {
          const isOpen = open.has(section.id);
          const minutes = section.lessons.reduce((m, l) => m + l.durationMinutes, 0);
          const sectionDone = section.lessons.filter((l) => done.has(l.id)).length;
          const panelId = `section-${section.id}`;
          return (
            <li key={section.id} className="border-b border-border-subtle last:border-b-0">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    const next = new Set(open);
                    if (isOpen) next.delete(section.id);
                    else next.add(section.id);
                    setOpen(next);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-raised"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-fg-muted tabular-nums">
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-fg">{section.title}</span>
                    <span className="text-xs text-fg-subtle">
                      {section.lessons.length} {unit}s · {formatDuration(minutes)}
                      {tracking ? ` · ${sectionDone}/${section.lessons.length} done` : ""}
                    </span>
                  </span>
                  <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-fg-muted transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
              </h3>
              <ul id={panelId} hidden={!isOpen} className="border-t border-border-subtle bg-surface/60 py-1">
                {section.lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    tracking={tracking}
                    done={done.has(lesson.id)}
                    onToggle={(value) => progress.run({ lessonId: lesson.id, done: value })}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LessonItem({ lesson, tracking, done, onToggle }: { lesson: Lesson; tracking: boolean; done: boolean; onToggle: (done: boolean) => void }) {
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className={cn("truncate text-[0.8125rem]", done ? "text-fg-muted line-through decoration-fg-subtle" : "text-fg-soft")}>{lesson.title}</span>
        {lesson.isPreview ? (
          <span className="shrink-0 rounded-full border border-green/30 px-2 py-0.5 text-[0.625rem] font-semibold text-green">Free preview</span>
        ) : null}
      </span>
      <span className="shrink-0 text-xs text-fg-subtle tabular-nums">{formatDuration(lesson.durationMinutes)}</span>
    </>
  );

  if (tracking) {
    return (
      <li>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-raised has-focus-visible:bg-raised">
          <input type="checkbox" checked={done} onChange={(event) => onToggle(event.target.checked)} className="peer sr-only" />
          <span
            aria-hidden
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors",
              done ? "border-green bg-green text-black" : "border-border-strong bg-surface",
            )}
          >
            {done ? <Check strokeWidth={3} className="size-3" /> : null}
          </span>
          {content}
        </label>
      </li>
    );
  }

  return (
    <li className="flex min-h-11 items-center gap-3 px-4 py-2">
      {lesson.isPreview ? (
        <PlayCircle aria-label="Preview available" className="size-[18px] shrink-0 text-green" />
      ) : (
        <Lock aria-hidden className="size-4 shrink-0 text-fg-subtle" />
      )}
      {content}
    </li>
  );
}
