// Screenshots at 375 / 768 / 1280 for design review and the README.
// Usage: pnpm screenshot [/path ...]   (needs the app running; BASE_URL defaults to localhost:3000)
// OUT_DIR defaults to docs/screenshots. FULL=1 captures full pages instead of the first two screens.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = process.env.OUT_DIR ?? "docs/screenshots";
const widths = [375, 768, 1280];
const full = process.env.FULL === "1";

async function defaultRoutes() {
  const response = await fetch(new URL("/api/learn?sort=rating&limit=1&type=courses", baseUrl));
  const { data } = await response.json();
  return [
    ["listing-grid", "/learn", false],
    ["listing-list", "/learn?view=list&pricing=FREE", false],
    ["detail", `/learn/${data[0].slug}`, false],
    ["category", "/learn/category/agents", false],
    ["library", "/learn/library", true],
    ["submit", "/learn/submit", true],
    ["login", "/login", false],
  ];
}

const args = process.argv.slice(2);
const routes =
  args.length > 0 ? args.map((route) => [route.replace(/^\//, "").replace(/[/?=&,]+/g, "-") || "home", route, false]) : await defaultRoutes();

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

async function logIn(page) {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "load" });
  await page.getByLabel("Email").fill("demo@aiorbit.dev");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/learn");
}

try {
  for (const width of widths) {
    const guest = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const member = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await logIn(await member.newPage());
    for (const [name, route, needsAuth] of routes) {
      const page = await (needsAuth ? member : guest).newPage();
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const file = path.join(outDir, `${name}-${width}.jpg`);
      await page.screenshot({
        path: file,
        type: "jpeg",
        quality: 78,
        fullPage: full,
        clip: full ? undefined : { x: 0, y: 0, width, height: Math.min(1800, await page.evaluate(() => document.body.scrollHeight)) },
      });
      console.log(`saved ${file}`);
      await page.close();
    }
    await guest.close();
    await member.close();
  }
} finally {
  await browser.close();
}
