// Accessibility audit: runs axe (WCAG 2.1 A/AA) on every page, logged out and logged in.
// Usage: pnpm a11y   (the app must be running; BASE_URL defaults to http://localhost:3000)
// Fails on serious or critical violations; lists minor/moderate ones as warnings.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const list = await (await fetch(`${base}/api/learn?sort=rating&limit=1`)).json();
const slug = list.data[0].slug;

const publicPages = [
  "/learn",
  "/learn?view=list&level=BEGINNER&pricing=FREE",
  "/learn?q=zzzz-no-match",
  "/learn/category/llms",
  `/learn/${slug}`,
  "/learn/no-such-resource",
  "/learn/library",
  "/learn/submit",
  "/login",
  "/signup",
];
const privatePages = ["/learn/library", "/learn/library?tab=in-progress", "/learn/submit", `/learn/${slug}`];

const browser = await chromium.launch();
let blocking = 0;

async function audit(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  blocking += serious.length;
  console.log(`${serious.length === 0 ? "ok  " : "FAIL"} ${path}`);
  for (const violation of results.violations) {
    console.log(`     ${violation.id} (${violation.impact}): ${violation.help}`);
    for (const node of violation.nodes.slice(0, 3)) console.log(`       ${node.target.join(" ")}`);
  }
}

for (const width of [1280, 375]) {
  console.log(`\n${width}px`);
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  for (const path of publicPages) await audit(page, path);

  await page.goto(`${base}/login`, { waitUntil: "load" });
  await page.getByLabel("Email").fill("demo@aiorbit.dev");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/learn");
  for (const path of privatePages) await audit(page, path);
  await context.close();
}

await browser.close();
console.log(`\n${blocking} serious/critical violation types`);
process.exitCode = blocking === 0 ? 0 : 1;
