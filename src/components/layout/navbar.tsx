"use client";

import { LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Container } from "./container";
import { Logo } from "./logo";

const links = [
  { href: "/learn", label: "Learn", exact: true },
  { href: "/learn?type=courses", label: "Courses", match: "courses" },
  { href: "/learn?type=guides", label: "Guides", match: "guides" },
  { href: "/learn/library", label: "My Library" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href || (pathname.startsWith("/learn/") && !pathname.startsWith("/learn/library") && !pathname.startsWith("/learn/submit")) : pathname === href;
  const onAuthPage = pathname === "/login" || pathname === "/signup";
  const loginHref = onAuthPage ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;
  const user = session?.user;

  const logOut = () => {
    setMenuOpen(false);
    void signOut({ redirectTo: "/learn" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-black/80 py-1 backdrop-blur-md">
      <Container className="flex h-[52px] items-center gap-6">
        <Logo />

        <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {links.map((link) => {
            const active = link.match ? false : isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-[0.8125rem] font-semibold transition-colors",
                  active ? "text-accent-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/learn/submit" size="xs" icon={<Plus aria-hidden />} className="hidden sm:inline-flex">
            Submit Resource
          </ButtonLink>
          <div className="hidden items-center gap-2 md:flex">
            {status === "loading" ? (
              <span aria-hidden className="h-7 w-16" />
            ) : user ? (
              <>
                <Link href="/learn/library" className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 text-[0.8125rem] font-medium text-fg-soft hover:text-fg">
                  <Avatar name={user.name ?? "You"} size="sm" />
                  <span className="max-w-[10ch] truncate">{user.name?.split(" ")[0]}</span>
                </Link>
                <Button variant="ghost" size="xs" onClick={logOut} aria-label="Log out" icon={<LogOut aria-hidden />} />
              </>
            ) : (
              <ButtonLink href={loginHref} variant="secondary" size="xs">
                Log In
              </ButtonLink>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-full text-fg hover:bg-hover md:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
        </div>
      </Container>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col">
          {[...links, { href: "/learn/submit", label: "Submit a resource" }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex h-12 items-center border-b border-border-subtle text-[0.9375rem] font-medium text-fg last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="flex min-w-0 items-center gap-2 text-sm text-fg-muted">
              <Avatar name={user.name ?? "You"} size="sm" />
              <span className="truncate">{user.email}</span>
            </span>
            <Button variant="secondary" size="sm" onClick={logOut}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ButtonLink href={loginHref} variant="secondary" onClick={() => setMenuOpen(false)}>
              Log In
            </ButtonLink>
            <ButtonLink href="/signup" onClick={() => setMenuOpen(false)}>
              Sign up
            </ButtonLink>
          </div>
        )}
      </Drawer>
    </header>
  );
}
