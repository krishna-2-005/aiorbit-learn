"use client";

import { useQuery } from "@tanstack/react-query";
import { Bookmark, CircleCheckBig, CirclePlay, TriangleAlert } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { formatRelative } from "@/lib/format";
import type { Library, LibraryItem } from "@/types/learn";
import { ProgressBar } from "./detail/progress-bar";
import { CardSkeleton, GRID_CLASSES } from "./listing-skeleton";
import { ResourceCard } from "./resource-card";

const TABS = ["saved", "in-progress", "completed"] as const;
type Tab = (typeof TABS)[number];

const EMPTY: Record<Tab, { icon: React.ReactNode; title: string; description: string }> = {
  saved: { icon: <Bookmark />, title: "Nothing saved yet", description: "Tap the bookmark on any course, guide or eBook to keep it here." },
  "in-progress": { icon: <CirclePlay />, title: "Nothing in progress", description: "Open a resource and choose “Mark as started” to track lessons as you go." },
  completed: { icon: <CircleCheckBig />, title: "No completed resources", description: "Finish every lesson or mark a resource complete and it shows up here." },
};

export function LibraryView({ initial }: { initial: Library }) {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("saved").withOptions({ history: "replace", scroll: false }));
  const query = useQuery({
    queryKey: ["library"],
    queryFn: () => apiFetch<Library>("/api/learn/library").then((r) => r.data),
    initialData: initial,
    staleTime: 0,
  });
  const { refetch } = query;

  // Saves and progress change on other pages; refresh when coming back.
  useEffect(() => {
    void refetch();
  }, [refetch]);

  const library = query.data;
  const lists: Record<Tab, LibraryItem[]> = { saved: library.saved, "in-progress": library.inProgress, completed: library.completed };

  function panel(key: Tab) {
    const items = lists[key];
    if (query.isError && !items.length) {
      return (
        <EmptyState
          icon={<TriangleAlert />}
          title="Couldn't load your library"
          description={query.error.message}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      );
    }
    if (query.isFetching && !items.length && query.isPending) {
      return (
        <div className={GRID_CLASSES}>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (!items.length) {
      const empty = EMPTY[key];
      return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={<ButtonLink href="/learn" variant="white">Browse resources</ButtonLink>} />;
    }
    return (
      <ul className={GRID_CLASSES}>
        {items.map((item) => (
          <li key={item.id}>
            <ResourceCard
              resource={item}
              overlay={
                item.progress ? (
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/90 to-transparent px-3 pt-8 pb-3">
                    <div className="flex items-center justify-between text-[0.6875rem] font-semibold text-white">
                      <span>{item.progress.status === "COMPLETED" ? "Completed" : `${item.progress.percent}% complete`}</span>
                      <span className="font-normal text-fg-soft">{formatRelative(item.progress.updatedAt)}</span>
                    </div>
                    <ProgressBar percent={item.progress.percent} label={`${item.title} progress`} size="sm" />
                  </div>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Tabs
      label="Library sections"
      value={tab}
      onValueChange={(value) => void setTab(value as Tab)}
      items={[
        { value: "saved", label: "Saved", count: library.saved.length, content: panel("saved") },
        { value: "in-progress", label: "In progress", count: library.inProgress.length, content: panel("in-progress") },
        { value: "completed", label: "Completed", count: library.completed.length, content: panel("completed") },
      ]}
    />
  );
}
