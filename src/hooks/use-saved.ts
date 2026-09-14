"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

const SAVED_KEY = ["saved-slugs"];

/** Slugs the signed-in user has saved; empty for guests. */
export function useSavedSlugs() {
  const { status } = useSession();
  return useQuery({
    queryKey: SAVED_KEY,
    queryFn: () => apiFetch<string[]>("/api/learn/saved").then((r) => new Set(r.data)),
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
  });
}

export function useIsSaved(slug: string, fallback = false) {
  const { data } = useSavedSlugs();
  return data ? data.has(slug) : fallback;
}

/** Optimistic save toggle. Guests get a toast that links to log in. */
export function useToggleSave() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const mutation = useMutation({
    mutationFn: ({ slug, save }: { slug: string; save: boolean; title: string }) =>
      apiFetch<{ saved: boolean; saveCount: number }>(`/api/learn/${slug}/save`, { method: save ? "PUT" : "DELETE" }),
    onMutate: async ({ slug, save }) => {
      await queryClient.cancelQueries({ queryKey: SAVED_KEY });
      const previous = queryClient.getQueryData<Set<string>>(SAVED_KEY);
      const next = new Set(previous);
      if (save) next.add(slug);
      else next.delete(slug);
      queryClient.setQueryData(SAVED_KEY, next);
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(SAVED_KEY, context?.previous);
      toast.error("Couldn't update your library", { description: error.message });
    },
    onSuccess: (_result, { save, title }) => {
      toast.success(save ? "Saved to your library" : "Removed from your library", {
        description: title,
        action: save ? { label: "View", onClick: () => router.push("/learn/library") } : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return (slug: string, save: boolean, title: string) => {
    if (status !== "authenticated") {
      toast.info("Log in to save resources", {
        description: "Your library keeps saved and in-progress resources in one place.",
        action: { label: "Log in", onClick: () => router.push(`/login?next=${encodeURIComponent(pathname)}`) },
      });
      return;
    }
    mutation.mutate({ slug, save, title });
  };
}
