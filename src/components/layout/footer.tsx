import Link from "next/link";
import { Container } from "./container";
import { LogoMark } from "./logo";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/learn?type=courses", label: "AI Courses" },
      { href: "/learn?type=guides", label: "AI Guides" },
      { href: "/learn?type=ebooks", label: "AI eBooks" },
      { href: "/learn?type=tutorials", label: "Tutorials" },
      { href: "/learn?type=newsletters", label: "Newsletters" },
    ],
  },
  {
    title: "Topics",
    links: [
      { href: "/learn/category/llms", label: "LLMs" },
      { href: "/learn/category/prompt-engineering", label: "Prompt Engineering" },
      { href: "/learn/category/agents", label: "AI Agents" },
      { href: "/learn/category/coding", label: "AI for Coding" },
      { href: "/learn/category/image-video", label: "Image & Video" },
    ],
  },
  {
    title: "Your space",
    links: [
      { href: "/learn/library", label: "My Library" },
      { href: "/learn/library?tab=in-progress", label: "In progress" },
      { href: "/learn/submit", label: "Submit a resource" },
      { href: "/signup", label: "Create account" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "https://aiorbit.club", label: "AI Orbit" },
      { href: "https://aiorbit.club/tools", label: "AI Tools" },
      { href: "https://aiorbit.club/companies", label: "AI Companies" },
      { href: "https://aiorbit.club/leaderboard", label: "Leaderboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-subtle">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="flex max-w-[34ch] flex-col gap-4">
          <span className="flex items-center gap-2 text-fg">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight">AIORBIT</span>
          </span>
          <p className="text-sm text-fg">The Home of Everything AI.</p>
          <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
            Courses, guides, eBooks and newsletters to learn the tools and ideas shaping the AI ecosystem.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-4">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <h2 className="eyebrow w-fit border-b border-border pb-3 pr-10 text-fg">{column.title}</h2>
              <ul className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center text-sm text-fg-soft transition-colors hover:text-accent-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <Container>
        <div className="flex flex-col gap-2 border-t border-border-subtle py-6 text-xs text-fg-subtle sm:flex-row sm:justify-between">
          <p>© 2026 AI Orbit. All rights reserved.</p>
          <p>Resource listings use sample data for demonstration.</p>
        </div>
      </Container>
    </footer>
  );
}
