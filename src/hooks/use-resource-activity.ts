"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import type { ReviewInput } from "@/lib/validations/learn";
import type { Review, Viewer, ViewerProgress } from "@/types/learn";

/* --------------------------------------------------------------- viewer */

export const viewerKey = (slug: string) => ["viewer", slug] as const;

export function useViewer(slug: string, initial: Viewer) {
  return useQuery({
    queryKey: viewerKey(slug),
    queryFn: () => Promise.resolve(initial),
    initialData: initial,
    staleTime: Infinity,
  });
}

type ProgressBody = { lessonId: string; done: boolean } | { complete: true } | { start: true };

/** Optimistic progress updates; the server recomputes the percentage and we reconcile. */
export function useProgress(slug: string, lessonIds: string[]) {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (body: ProgressBody | "reset") =>
      body === "reset"
        ? apiFetch<{ removed: boolean }>(`/api/learn/${slug}/progress`, { method: "DELETE" }).then(() => null)
        : apiFetch<ViewerProgress>(`/api/learn/${slug}/progress`, { method: "PUT", json: body }).then((r) => r.data),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: viewerKey(slug) });
      const previous = queryClient.getQueryData<Viewer>(viewerKey(slug));
      if (previous) {
        queryClient.setQueryData<Viewer>(viewerKey(slug), { ...previous, progress: optimisticProgress(previous.progress, body, lessonIds) });
      }
      return { previous };
    },
    onError: (error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(viewerKey(slug), context.previous);
      toast.error("Couldn't update progress", { description: error.message });
    },
    onSuccess: (progress, body) => {
      queryClient.setQueryData<Viewer>(viewerKey(slug), (viewer) => (viewer ? { ...viewer, progress } : viewer));
      void queryClient.invalidateQueries({ queryKey: ["library"] });
      if (body === "reset") toast.success("Progress reset");
      else if ("complete" in body || progress?.status === "COMPLETED") toast.success("Marked as complete", { description: "Nice work — it's in your library under Completed." });
      else if ("start" in body) toast.success("Added to In progress", { description: "Tick lessons in the curriculum as you go." });
    },
  });

  return {
    pending: mutation.isPending,
    run: (body: ProgressBody | "reset") => {
      if (status !== "authenticated") {
        toast.info("Log in to track progress", {
          action: { label: "Log in", onClick: () => router.push(`/login?next=${encodeURIComponent(`/learn/${slug}`)}`) },
        });
        return;
      }
      mutation.mutate(body);
    },
  };
}

function optimisticProgress(current: ViewerProgress | null, body: ProgressBody | "reset", lessonIds: string[]): ViewerProgress | null {
  if (body === "reset") return null;
  const done = new Set(current?.completedLessonIds ?? []);
  if ("lessonId" in body) {
    if (body.done) done.add(body.lessonId);
    else done.delete(body.lessonId);
  } else if ("complete" in body) {
    lessonIds.forEach((id) => done.add(id));
  }
  const completedLessonIds = lessonIds.filter((id) => done.has(id));
  const percent = lessonIds.length ? Math.round((completedLessonIds.length / lessonIds.length) * 100) : 0;
  return {
    status: "complete" in body || percent === 100 ? "COMPLETED" : "STARTED",
    completedLessonIds,
    percent,
    updatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------- reviews */

type ReviewsMeta = { nextCursor: string | null; viewerHasReviewed: boolean };
type ReviewPage = { data: Review[]; meta: ReviewsMeta };
export type CreatedReview = { review: Review; ratingAvg: number; ratingCount: number };

export const reviewsKey = (slug: string) => ["reviews", slug] as const;

export function useReviews(slug: string, initial: ReviewPage) {
  return useInfiniteQuery({
    queryKey: reviewsKey(slug),
    queryFn: ({ pageParam, signal }) =>
      apiFetch<Review[], ReviewsMeta>(`/api/learn/${slug}/reviews${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last: ReviewPage) => last.meta.nextCursor,
    initialData: { pages: [initial], pageParams: [null] },
    staleTime: 60_000,
  });
}

/** Optimistic create: the review appears at the top immediately and rolls back on failure. */
export function useCreateReview(slug: string, authorName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewInput) => (await apiFetch<CreatedReview>(`/api/learn/${slug}/reviews`, { method: "POST", json: input })).data,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: reviewsKey(slug) });
      const previous = queryClient.getQueryData<InfiniteData<ReviewPage>>(reviewsKey(slug));
      const optimistic: Review = { id: `pending-${Date.now()}`, ...input, createdAt: new Date().toISOString(), author: authorName, isOwn: true };
      queryClient.setQueryData<InfiniteData<ReviewPage>>(reviewsKey(slug), (data) => prepend(data, optimistic));
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(reviewsKey(slug), context?.previous);
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<InfiniteData<ReviewPage>>(reviewsKey(slug), (data) => {
        const withoutPending = data && {
          ...data,
          pages: data.pages.map((page) => ({ ...page, data: page.data.filter((r) => r.id !== context?.optimisticId) })),
        };
        return prepend(withoutPending, created.review);
      });
      queryClient.setQueryData<Viewer>(viewerKey(slug), (viewer) => (viewer ? { ...viewer, hasReviewed: true } : viewer));
    },
  });
}

function prepend(data: InfiniteData<ReviewPage> | undefined, review: Review) {
  if (!data) return data;
  const [first, ...rest] = data.pages;
  if (!first) return data;
  return { ...data, pages: [{ data: [review, ...first.data], meta: { ...first.meta, viewerHasReviewed: true } }, ...rest] };
}
