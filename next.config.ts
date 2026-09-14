import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so stray lockfiles in parent folders are ignored.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
    // Local escape hatch for networks whose HTTPS proxy Node doesn't trust. Never set in production.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
  },
  async redirects() {
    return [{ source: "/", destination: "/learn", permanent: false }];
  },
};

export default nextConfig;
