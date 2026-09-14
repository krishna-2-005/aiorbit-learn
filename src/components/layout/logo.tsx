import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M5.5 16.5 16.5 5.5M8 18.5 18.5 8M11.5 19.5l8-8" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/learn" aria-label="AI Orbit Learn home" className={cn("flex items-center gap-2 text-fg", className)}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight">AIORBIT</span>
    </Link>
  );
}
