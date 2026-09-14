import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toast";
import { appUrl } from "@/lib/site";
import "./globals.css";

const tagline = "Courses, guides, eBooks, tutorials and newsletters to learn AI — curated by AI Orbit.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Learn AI — Courses, Guides & eBooks | AI Orbit", template: "%s | AI Orbit Learn" },
  description: tagline,
  openGraph: { siteName: "AI Orbit", title: "AI Orbit Learn", description: tagline, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="flex min-h-dvh flex-col bg-bg text-fg">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
