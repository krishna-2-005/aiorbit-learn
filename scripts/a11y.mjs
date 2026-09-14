// Accessibility audit: runs axe (WCAG 2.1 A/AA) on every page, logged out and logged in.
// Usage: pnpm a11y   (the app must be running; BASE_URL defaults to http://localhost:3000)
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const list = await (await fetch(`${base}/api/colleges?sort=package&limit=3`)).json();
const slugs = list.data.map((college) => college.slug);

const publicPages = [
  "/",
  "/colleges",
  "/colleges?state=Karnataka&course=BTECH&minRating=4",
  `/colleges/${slugs[0]}`,
  `/compare?ids=${slugs.join(",")}`,
  "/compare",
  "/predict",
  "/predict?exam=JEE_MAIN&rank=40000",
  "/login",
  "/signup",
  "/colleges/no-such-college",
  "/dev/ui",
];
const privatePages = ["/saved", "/saved?tab=comparisons"];

const browser = await chromium.launch();
let failures = 0;

async function audit(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const violations = results.violations;
  failures += violations.length;
  console.log(`${violations.length === 0 ? "ok  " : "FAIL"} ${path}`);
  for (const violation of violations) {
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
  await page.getByLabel("Email").fill("demo@collegepick.dev");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
  for (const path of privatePages) await audit(page, path);
  await context.close();
}

await browser.close();
console.log(`\n${failures} violation types`);
process.exitCode = failures === 0 ? 0 : 1;
