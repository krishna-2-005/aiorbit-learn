// Full-page screenshots at 375 / 768 / 1280 for design review and the README.
// Usage: pnpm screenshot [/path ...]   (needs the app running; BASE_URL defaults to localhost:3000)
// OUT_DIR defaults to docs/screenshots.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = process.env.OUT_DIR ?? "docs/screenshots";
const widths = [375, 768, 1280];

async function defaultRoutes() {
  const response = await fetch(new URL("/api/colleges?sort=package&limit=3", baseUrl));
  const { data } = await response.json();
  const slugs = data.map((college) => college.slug);
  return [
    ["home", "/"],
    ["listing", "/colleges"],
    ["listing-filtered", "/colleges?state=Karnataka&course=BTECH"],
    ["detail", `/colleges/${slugs[0]}`],
    ["compare", `/compare?ids=${slugs.join(",")}`],
    ["login", "/login"],
  ];
}

const args = process.argv.slice(2);
const routes = args.length > 0
  ? args.map((route) => [route === "/" ? "home" : route.replace(/^\//, "").replace(/[/?=&,]+/g, "-"), route])
  : await defaultRoutes();

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

try {
  for (const [name, route] of routes) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      // "networkidle" never settles while Next prefetches links; wait for load and fonts instead.
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Let lazy images below the fold load before a full-page capture.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      // JPEG keeps the committed screenshots small (photos compress badly as PNG).
      const file = path.join(outDir, `${name}-${width}.jpg`);
      await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 80 });
      console.log(`saved ${file}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
