import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined;

// Teach tailwind-merge our custom radius and shadow names so overrides resolve.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "control", "card", "panel"],
      shadow: ["float"],
    },
  },
});

/** Join class names, skipping falsy values; later classes win conflicts (h-11 + h-13 -> h-13). */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

/** Up to two initials from a name, e.g. "IIIT Bangalore" -> "IB". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}
